const BASE = process.env.WAHA_URL!;
const KEY = process.env.WAHA_API_KEY!;
const SESSION = process.env.WAHA_SESSION ?? "default";

const headers = () => ({ "X-Api-Key": KEY, "Content-Type": "application/json" });

export async function getChats() {
  const res = await fetch(`${BASE}/api/${SESSION}/chats?limit=100`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getChatMessages(chatId: string, limit = 50) {
  const res = await fetch(
    `${BASE}/api/${SESSION}/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}&downloadMedia=false`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function sendMessage(chatId: string, text: string) {
  const res = await fetch(`${BASE}/api/sendText`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ chatId, text, session: SESSION }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${BASE}/api/sessions`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function setWebhook(url: string) {
  const res = await fetch(`${BASE}/api/${SESSION}/webhook/set`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url, events: ["message", "message.any"] }),
  });
  return res.ok;
}

export { SESSION };
