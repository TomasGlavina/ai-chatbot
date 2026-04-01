const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
const SESSION_KEY = 'copilot_chat_session';
const USER_ID_KEY = 'copilot_user_id';

function loadSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = `browser-${crypto.randomUUID()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

export async function initializeSession() {
  const existingSession = loadSession();

  if (existingSession?.conversationId) {
    return existingSession;
  }

  const userId = getUserId();
  const res = await fetch(`${API_BASE_URL}/api/chat/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });

  if (!res.ok) {
    throw new Error('Unable to create chat session');
  }

  const payload = await res.json();
  const session = {
    ...payload,
    userId
  };

  saveSession(session);
  return session;
}

export async function sendMessage(text, metadata = {}) {
  const session = await initializeSession();
  const res = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      metadata,
      conversationId: session.conversationId,
      userId: session.userId
    })
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const payload = await res.json();
  saveSession({
    ...session,
    conversationId: payload.conversationId ?? session.conversationId,
    mode: payload.mode ?? session.mode
  });
  return payload;
}
