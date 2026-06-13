// Remove duplicate contacts (keep most recent)
const PB_URL = "http://localhost:8090";

async function main() {
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: "admin@rylsports.lobocrea.pro", password: "RyLSports2026!" }),
  });
  const { token } = await authRes.json();
  const headers = { Authorization: `Bearer ${token}` };

  const res = await fetch(`${PB_URL}/api/collections/contacts/records?perPage=500`, { headers });
  const data = await res.json();
  const contacts = data.items || [];

  const seen = {};
  for (const c of contacts) {
    if (seen[c.phone]) {
      // Delete older duplicate
      await fetch(`${PB_URL}/api/collections/contacts/records/${c.id}`, { method: "DELETE", headers });
      console.log(`Deleted duplicate: ${c.phone} (${c.id})`);
    } else {
      seen[c.phone] = c.id;
    }
  }
  console.log("Done. Contacts remaining:", Object.keys(seen).length);
}

main().catch(console.error);
