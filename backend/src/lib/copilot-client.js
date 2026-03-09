import crypto from 'node:crypto';

export async function createChatSession({ userId, config }) {
  if (config.copilotMode === 'mock') {
    return createMockChatSession(userId, config);
  }

  if (!config.isCopilotReady) {
    const error = new Error('Copilot configuration is incomplete.');
    error.statusCode = 500;
    error.details = { missingEnv: config.missingCopilotEnv };
    throw error;
  }

  return createLiveChatSession(config);
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
  const conversationId = payload.conversationId ?? null;
  const expiresIn = payload.expires_in ?? payload.expiresIn ?? null;
  const streamUrl = payload.streamUrl ?? null;

  if (!token || !conversationId) {
    const error = new Error('Copilot token endpoint returned an invalid payload.');
    error.statusCode = 502;
    error.details = {
      receivedKeys: Object.keys(payload ?? {}),
    };
    throw error;
  }

  return {
    conversationId,
    token,
    streamUrl,
    expiresIn,
    mode: 'copilot-direct-line',
    directLineDomain: config.directLineDomain,
    mock: false,
  };
}
