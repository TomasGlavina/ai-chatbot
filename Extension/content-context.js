const REQUEST_PAGE_CONTEXT = "COPILOT_REQUEST_PAGE_CONTEXT";
const PAGE_CONTEXT = "COPILOT_PAGE_CONTEXT";

function getChatFrame() {
  return document.getElementById("copilotChatFrame");
}

window.addEventListener("message", (event) => {
  const frame = getChatFrame();

  if (!frame || event.source !== frame.contentWindow) {
    return;
  }

  const frameOrigin = new URL(frame.src).origin;

  if (event.origin !== frameOrigin || event.data?.type !== REQUEST_PAGE_CONTEXT) {
    return;
  }

  const context = {
    title: document.title,
    url: location.href,
    text: document.body.innerText.slice(0, 5000)
  };

  event.source.postMessage({
    type: PAGE_CONTEXT,
    data: context
  }, frameOrigin);
});
