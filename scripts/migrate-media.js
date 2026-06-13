const PB_URL = "http://localhost:8090";

async function main() {
  const { token } = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "admin@rylsports.lobocrea.pro", password: "RyLSports2026!" }),
  }).then(r => r.json());
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Get messages collection
  const col = await fetch(`${PB_URL}/api/collections/messages`, { headers }).then(r => r.json());
  const hasMediaUrl = col.fields?.some(f => f.name === "media_url");
  const hasMediaType = col.fields?.some(f => f.name === "media_mime");

  if (!hasMediaUrl || !hasMediaType) {
    const newFields = [...(col.fields || [])];
    if (!hasMediaUrl) newFields.push({ name: "media_url", type: "url" });
    if (!hasMediaType) newFields.push({ name: "media_mime", type: "text" });

    const res = await fetch(`${PB_URL}/api/collections/${col.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields: newFields }),
    });
    const data = await res.json();
    if (data.id) console.log("Added media_url and media_mime fields to messages");
    else console.error("Failed:", JSON.stringify(data).slice(0, 200));
  } else {
    console.log("Fields already exist");
  }
}
main().catch(console.error);
