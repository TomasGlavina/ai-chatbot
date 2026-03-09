export async function sendMessage(text, metadata = {}) {

  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      metadata
    })
  });

  if (!res.ok) {
    throw new Error("Server error");
  }

  return await res.json();
}