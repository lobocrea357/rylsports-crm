const PB_URL = "http://localhost:8090";

async function main() {
  const { token } = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "admin@rylsports.lobocrea.pro", password: "RyLSports2026!" }),
  }).then(r => r.json());
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const col = await fetch(`${PB_URL}/api/collections/contacts`, { headers }).then(r => r.json());

  const hasRead = col.fields?.some(f => f.name === "read");
  if (!hasRead) {
    const newFields = [...(col.fields || []), { name: "read", type: "bool" }];
    const res = await fetch(`${PB_URL}/api/collections/${col.id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ fields: newFields }),
    }).then(r => r.json());
    console.log(res.id ? "✅ Added 'read' field to contacts" : "❌ Failed: " + JSON.stringify(res).slice(0, 200));
  } else {
    console.log("✅ 'read' field already exists");
  }
  console.log("Migration v3 done.");
}
main().catch(console.error);
