const PB_URL = "http://localhost:8090";

async function main() {
  const { token } = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "admin@rylsports.lobocrea.pro", password: "RyLSports2026!" }),
  }).then(r => r.json());
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Add last_message_preview to contacts
  const col = await fetch(`${PB_URL}/api/collections/contacts`, { headers }).then(r => r.json());
  const hasPreview = col.fields?.some(f => f.name === "last_message_preview");
  if (!hasPreview) {
    const newFields = [...(col.fields || []), { name: "last_message_preview", type: "text" }];
    const res = await fetch(`${PB_URL}/api/collections/${col.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ fields: newFields }),
    }).then(r => r.json());
    console.log(res.id ? "Added last_message_preview to contacts" : "Failed: " + JSON.stringify(res).slice(0,200));
  } else {
    console.log("last_message_preview already exists");
  }

  // Change media_url from url type to text (to allow localhost URLs)
  const msgCol = await fetch(`${PB_URL}/api/collections/messages`, { headers }).then(r => r.json());
  const mediaField = msgCol.fields?.find(f => f.name === "media_url");
  if (mediaField && mediaField.type === "url") {
    const newFields = msgCol.fields.map(f => f.name === "media_url" ? { ...f, type: "text" } : f);
    const res = await fetch(`${PB_URL}/api/collections/${msgCol.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ fields: newFields }),
    }).then(r => r.json());
    console.log(res.id ? "Changed media_url to text type" : "Failed: " + JSON.stringify(res).slice(0,200));
  } else {
    console.log("media_url field OK (already text or not found)");
  }

  console.log("Migration v2 done.");
}
main().catch(console.error);
