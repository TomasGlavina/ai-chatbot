const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const CONVERSATION_ID_KEY = 'copilot_conversation_id';

function loadConversationId() {
  return sessionStorage.getItem(CONVERSATION_ID_KEY);
}

function saveConversationId(conversationId) {
  if (!conversationId) {
    return;
  }

  sessionStorage.setItem(CONVERSATION_ID_KEY, conversationId);
}

export async function sendMessage(text, metadata = {}) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      metadata,
      conversationId: loadConversationId()
    })
  });

  if (!res.ok) {
    throw new Error("Server error");
  }

  const payload = await res.json();
  saveConversationId(payload.conversationId);
  return payload;
}
