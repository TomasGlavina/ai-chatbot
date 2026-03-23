import crypto from 'node:crypto';

const conversationStore = new Map();

export async function createChatSession({ userId, config }) {
  if (config.copilotMode === 'mock') {
    const session = createMockChatSession(userId, config);
    rememberConversation(session);
    return session;
  }

  if (!config.isCopilotReady) {
    const error = new Error('Copilot configuration is incomplete.');
    error.statusCode = 500;
    error.details = { missingEnv: config.missingCopilotEnv };
    throw error;
  }

  const session = await createLiveChatSession(config);
  rememberConversation({
    ...session,
    userId,
    watermark: null,
  });
  return session;
}

export async function sendChatMessage({ userId, text, metadata, conversationId, config }) {
  if (config.copilotMode === 'mock') {
    const session = getOrCreateMockConversation({ userId, conversationId, config });
    return {
      conversationId: session.conversationId,
      text: buildMockReply(text, metadata),
      mode: 'mock-direct-line',
      mock: true,
    };
  }

  let session = getConversation(conversationId);

  if (!session) {
    const createdSession = await createLiveChatSession(config);
    session = {
      ...createdSession,
      userId,
      watermark: null,
    };
    rememberConversation(session);
  }

  await postUserMessage({ session, userId, text, metadata, config });
  const botReply = await waitForBotReply({ session, userId, config });

  return {
    conversationId: session.conversationId,
    text: botReply.text,
    mode: 'copilot-direct-line',
    mock: false,
  };
}

function createMockChatSession(userId, config) {
  return {
    conversationId: `mock-${crypto.randomUUID()}`,
    token: `mock-token-${crypto.randomUUID()}`,
    streamUrl: null,
    expiresIn: 1800,
    mode: 'mock-direct-line',
    directLineDomain: config.directLineDomain,
    userId,
    mock: true,
  };
}

function getOrCreateMockConversation({ userId, conversationId, config }) {
  const existingSession = getConversation(conversationId);

  if (existingSession) {
    return existingSession;
  }

  const createdSession = createMockChatSession(userId, config);
  rememberConversation(createdSession);
  return createdSession;
}

async function createLiveChatSession(config) {
  const response = await fetch(config.copilotTokenEndpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error('Copilot token endpoint request failed.');
    error.statusCode = 502;
    error.details = {
      status: response.status,
      statusText: response.statusText,
      body,
    };
    throw error;
  }

  const payload = await response.json();
  const token = payload.token ?? null;

  if (!token) {
    const error = new Error('Copilot token endpoint returned an invalid payload.');
    error.statusCode = 502;
    error.details = {
      receivedKeys: Object.keys(payload ?? {}),
    };
    throw error;
  }

  return startDirectLineConversation({ token, config });
}

async function startDirectLineConversation({ token, config }) {
  const response = await fetch(`${config.directLineDomain}/conversations`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error('Failed to start a Direct Line conversation.');
    error.statusCode = 502;
    error.details = {
      status: response.status,
      statusText: response.statusText,
      body,
    };
    throw error;
  }

  const payload = await response.json();
  const conversationId = payload.conversationId ?? null;
  const expiresIn = payload.expires_in ?? payload.expiresIn ?? null;
  const streamUrl = payload.streamUrl ?? null;
  const conversationToken = payload.token ?? token;

  if (!conversationId) {
    const error = new Error('Direct Line start conversation response was invalid.');
    error.statusCode = 502;
    error.details = {
      receivedKeys: Object.keys(payload ?? {}),
    };
    throw error;
  }

  return {
    conversationId,
    token: conversationToken,
    streamUrl,
    expiresIn,
    mode: 'copilot-direct-line',
    directLineDomain: config.directLineDomain,
    mock: false,
  };
}

async function postUserMessage({ session, userId, text, metadata, config }) {
  const response = await fetch(
    `${config.directLineDomain}/conversations/${session.conversationId}/activities`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message',
        locale: 'en-US',
        from: {
          id: userId,
          name: userId,
        },
        text: composeMessageText(text, metadata),
        channelData: {
          metadata,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    const error = new Error('Direct Line rejected the user message.');
    error.statusCode = 502;
    error.details = {
      status: response.status,
      statusText: response.statusText,
      body,
    };
    throw error;
  }
}

async function waitForBotReply({ session, userId, config }) {
  for (let attempt = 0; attempt < config.directLinePollAttempts; attempt += 1) {
    const query = new URLSearchParams();

    if (session.watermark) {
      query.set('watermark', session.watermark);
    }

    const url = `${config.directLineDomain}/conversations/${session.conversationId}/activities${
      query.size > 0 ? `?${query.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      const error = new Error('Failed to read Direct Line activities.');
      error.statusCode = 502;
      error.details = {
        status: response.status,
        statusText: response.statusText,
        body,
      };
      throw error;
    }

    const activitySet = await response.json();
    session.watermark = activitySet.watermark ?? session.watermark ?? null;
    rememberConversation(session);

    const botMessages = (activitySet.activities ?? []).filter((activity) =>
      isBotMessage(activity, userId),
    );

    if (botMessages.length > 0) {
      return {
        text: botMessages.map(extractActivityText).join('\n\n'),
      };
    }

    await sleep(config.directLinePollIntervalMs);
  }

  const error = new Error('Timed out waiting for the bot response.');
  error.statusCode = 504;
  throw error;
}

function composeMessageText(text, metadata) {
  if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
    return text;
  }

  const contextPayload = JSON.stringify(metadata, null, 2).slice(0, 2000);

  return `${text}\n\nPage context:\n${contextPayload}`;
}

function isBotMessage(activity, userId) {
  return (
    activity?.type === 'message' &&
    activity?.from?.role === 'bot' &&
    activity?.from?.id !== userId &&
    activity?.text != null &&
    activity.text !== ''
  );
}

function extractActivityText(activity) {
  return activity.text || activity.speak || '[Non-text response received]';
}

function rememberConversation(session) {
  if (!session?.conversationId) {
    return;
  }

  conversationStore.set(session.conversationId, session);
}

function getConversation(conversationId) {
  if (!conversationId) {
    return null;
  }

  return conversationStore.get(conversationId) ?? null;
}

function buildMockReply(text, metadata) {
  const hasContext =
    metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0;

  if (hasContext) {
    return `Mock reply: received "${text}" with page context attached.`;
  }

  return `Mock reply: received "${text}".`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
