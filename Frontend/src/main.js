import "./style.css";
import { initializeSession, sendMessage } from "./agent-api.js";
import { loadHistory, saveHistory, subscribe } from "./chatState.js";

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const contextBtn = document.getElementById("contextBtn");
const REQUEST_PAGE_CONTEXT = "COPILOT_REQUEST_PAGE_CONTEXT";
const PAGE_CONTEXT = "COPILOT_PAGE_CONTEXT";


let history = loadHistory();
let pageContext = null;
const parentOrigin = getParentOrigin();

/* Render previous messages */

history.forEach(m => addMessage(m.role,m.text));

subscribe(newHistory=>{
  history = newHistory;
  render();
});

if (!parentOrigin) {
  contextBtn.disabled = true;
  contextBtn.title = "Page context is only available inside the browser extension.";
}

initializeSession().catch(() => {
  addMessage("System","Chat session unavailable.");
});

function render(){
  chat.innerHTML="";
  history.forEach(m => addMessage(m.role,m.text));
}

function addMessage(role,text){
const div = document.createElement("div");
div.className = `message ${role}`;

const label = document.createElement("span");
label.className = "messageLabel";
label.textContent = role;

const body = document.createElement("p");
body.className = "messageText";
body.textContent = text;

div.append(label, body);
chat.appendChild(div);
chat.scrollTop = chat.scrollHeight;
}

function getParentOrigin() {
  if (window.parent === window || !document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

/* Request page context */
contextBtn.onclick = () => {
if (!parentOrigin) return;
window.parent.postMessage(
  {type:REQUEST_PAGE_CONTEXT},
  parentOrigin
);
};

/* Receive context */
window.addEventListener("message",event=>{
if(event.source !== window.parent) return;
if(parentOrigin && event.origin !== parentOrigin) return;
if(event.data?.type===PAGE_CONTEXT){
  pageContext = event.data.data;
  addMessage("System","Page context attached.");
}
});

/* Send chat */
sendBtn.onclick = async () => {
const text = input.value.trim();
if(!text) return;
history.push({role:"User",text});
saveHistory(history);
addMessage("User",text);
input.value="";
try{
const res = await sendMessage(text,pageContext);
history.push({role:"Agent",text:res.text});
saveHistory(history);
addMessage("Agent",res.text);
pageContext = null;
}catch{
history.push({role:"System",text:"Agent server unreachable"});
saveHistory(history);
addMessage("System","Agent server unreachable");
}
};
