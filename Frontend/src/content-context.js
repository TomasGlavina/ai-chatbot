window.addEventListener("message",event=>{
if(event.data?.type==="REQUEST_PAGE_CONTEXT"){
const context={
  title:document.title,
  url:location.href,
  text:document.body.innerText.slice(0,4000)
};
event.source.postMessage({
  type:"PAGE_CONTEXT",
  data:context
},"*");
}
});