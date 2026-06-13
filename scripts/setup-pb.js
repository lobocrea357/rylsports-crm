// Setup PocketBase collections
const PB_URL = "http://localhost:8090";
const EMAIL = "admin@rylsports.lobocrea.pro";
const PASS = "RyLSports2026!";

async function main() {
  // Auth
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  const { token } = await authRes.json();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const collections = [
    {
      name: "contacts",
      type: "base",
      schema: [
        { name: "phone", type: "text", required: true, options: { min: 1 } },
        { name: "name", type: "text" },
        { name: "session", type: "text" },
        { name: "category", type: "select", options: { values: ["prospect","interested","negotiating","sold","cold","support"], maxSelect: 1 } },
        { name: "sale_status", type: "select", options: { values: ["none","close","done"], maxSelect: 1 } },
        { name: "ai_summary", type: "text" },
        { name: "notes", type: "text" },
        { name: "last_message_at", type: "date" },
      ],
      indexes: [],
    },
    {
      name: "messages",
      type: "base",
      schema: [
        { name: "contact", type: "relation", required: true, options: { collectionId: "contacts", maxSelect: 1 } },
        { name: "waha_message_id", type: "text" },
        { name: "content", type: "text" },
        { name: "from_me", type: "bool" },
        { name: "timestamp", type: "date" },
        { name: "message_type", type: "text" },
      ],
    },
  ];

  // Get existing collections
  const listRes = await fetch(`${PB_URL}/api/collections`, { headers });
  const existing = await listRes.json();
  const existingNames = (existing.items || []).map((c) => c.name);

  for (const col of collections) {
    if (existingNames.includes(col.name)) {
      console.log(`Collection '${col.name}' already exists, skipping.`);
      continue;
    }
    const res = await fetch(`${PB_URL}/api/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify(col),
    });
    const data = await res.json();
    if (data.id) {
      console.log(`Created collection: ${col.name}`);
    } else {
      console.error(`Failed to create ${col.name}:`, JSON.stringify(data));
    }
  }

  console.log("PocketBase setup complete!");
}

main().catch(console.error);
