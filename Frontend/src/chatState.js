const STORAGE_KEY = "copilot_chat_history";

const channel = new BroadcastChannel("copilot-chat");

export function loadHistory(){
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveHistory(history){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(history));
  channel.postMessage(history);
}

export function subscribe(callback){
  channel.onmessage = e => callback(e.data);
}