(function () {
const CHAT_UI_URL = "http://localhost:3000";

if (window.__COPILOT_CHAT_BUBBLE__) return;
window.__COPILOT_CHAT_BUBBLE__ = true;

const bubble = document.createElement("div");

bubble.id = "copilotBubble";
bubble.textContent = "💬";

Object.assign(bubble.style,{
  position:"fixed",
  bottom:"20px",
  right:"20px",
  width:"60px",
  height:"60px",
  borderRadius:"50%",
  background:"#0078D4",
  color:"white",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontSize:"24px",
  cursor:"pointer",
  zIndex:"999999",
  boxShadow:"0 4px 12px rgba(0,0,0,0.3)"
});

document.body.appendChild(bubble);

function toggleChat(){

let frame = document.getElementById("copilotChatFrame");

if(frame){
  frame.remove();
  return;
}

frame = document.createElement("iframe");

frame.id = "copilotChatFrame";
frame.src = CHAT_UI_URL;
frame.title = "Copilot Chat";
frame.style.position = "fixed";
frame.style.bottom = "90px";
frame.style.right = "20px";
frame.style.width = "420px";
frame.style.height = "600px";
frame.style.border = "none";
frame.style.borderRadius = "12px";
frame.style.zIndex = "999999";
frame.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";

document.body.appendChild(frame);

}

bubble.addEventListener("click",toggleChat);

})();
