// Setup PocketBase collections - compatible with PocketBase v0.22+
const PB_URL = "http://localhost:8090";
const EMAIL = "admin@rylsports.lobocrea.pro";
const PASS = "RyLSports2026!";

async function main() {
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  const { token } = await authRes.json();
  if (!token) { console.error("Auth failed"); process.exit(1); }
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Get existing collections
  const listRes = await fetch(`${PB_URL}/api/collections`, { headers });
  const existing = await listRes.json();
  const existingMap = Object.fromEntries((existing.items || []).map((c) => [c.name, c]));

  // Delete old empty collections so we can recreate them
  for (const name of ["messages", "contacts"]) {
    if (existingMap[name]) {
      const fields = existingMap[name].fields || [];
      // Only recreate if fields are missing (empty collection)
      if (fields.length <= 1) {
        console.log(`Deleting empty collection: ${name}`);
        await fetch(`${PB_URL}/api/collections/${existingMap[name].id}`, { method: "DELETE", headers });
      }
    }
  }

  // Re-fetch after deletes
  const list2Res = await fetch(`${PB_URL}/api/collections`, { headers });
  const existing2 = await list2Res.json();
  const existingNames = (existing2.items || []).map((c) => c.name);

  let contactsId = existing2.items?.find(c => c.name === "contacts")?.id;

  // Create contacts collection
  if (!existingNames.includes("contacts")) {
    const res = await fetch(`${PB_URL}/api/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "contacts",
        type: "base",
        fields: [
          { name: "phone", type: "text", required: true },
          { name: "name", type: "text" },
          { name: "session", type: "text" },
          { name: "category", type: "select", values: ["prospect","interested","negotiating","sold","cold","support"], maxSelect: 1 },
          { name: "sale_status", type: "select", values: ["none","close","done"], maxSelect: 1 },
          { name: "ai_summary", type: "text" },
          { name: "notes", type: "text" },
          { name: "last_message_at", type: "date" },
        ],
      }),
    });
    const data = await res.json();
    if (data.id) {
      contactsId = data.id;
      console.log("Created collection: contacts", data.id);
    } else {
      console.error("Failed contacts:", JSON.stringify(data));
    }
  } else {
    console.log("contacts already exists OK");
  }

  // Create messages collection
  if (!existingNames.includes("messages")) {
    const res = await fetch(`${PB_URL}/api/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "messages",
        type: "base",
        fields: [
          { name: "contact", type: "relation", collectionId: contactsId, maxSelect: 1, required: true },
          { name: "waha_message_id", type: "text" },
          { name: "content", type: "text" },
          { name: "from_me", type: "bool" },
          { name: "timestamp", type: "date" },
          { name: "message_type", type: "text" },
        ],
      }),
    });
    const data = await res.json();
    if (data.id) console.log("Created collection: messages", data.id);
    else console.error("Failed messages:", JSON.stringify(data));
  } else {
    console.log("messages already exists OK");
  }

  console.log("Done!");
}

main().catch(console.error);
