import "./style.css";
import { sendMessage } from "./agent-api.js";
import { loadHistory, saveHistory, subscribe } from "./chatState.js";

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const contextBtn = document.getElementById("contextBtn");


let history = loadHistory();
let pageContext = null;

/* Render previous messages */

history.forEach(m => addMessage(m.role,m.text));

subscribe(newHistory=>{
  history = newHistory;
  render();
});

function render(){
  chat.innerHTML="";
  history.forEach(m => addMessage(m.role,m.text));
}

function addMessage(role,text){

const div = document.createElement("div");
div.className = role;
div.textContent = `${role}: ${text}`;

chat.appendChild(div);

chat.scrollTop = chat.scrollHeight;
}

/* Request page context */
contextBtn.onclick = () => {
window.parent.postMessage(
  {type:"REQUEST_PAGE_CONTEXT"},
  "*"
);
};

/* Receive context */
window.addEventListener("message",event=>{
if(event.data?.type==="PAGE_CONTEXT"){
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