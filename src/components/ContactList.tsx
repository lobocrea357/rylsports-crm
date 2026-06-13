"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import CategoryBadge from "./CategoryBadge";
import type { Contact, Category } from "@/lib/pocketbase";
import { CATEGORY_COLORS } from "@/lib/pocketbase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIES: Array<{ key: Category | "all"; label: string; dot: string }> = [
  { key: "all",         label: "Todos",      dot: "bg-slate-400" },
  { key: "prospect",   label: "Prospecto",  dot: "bg-blue-400" },
  { key: "interested", label: "Interesado", dot: "bg-yellow-400" },
  { key: "negotiating",label: "Negociando", dot: "bg-orange-400" },
  { key: "sold",       label: "Vendido",    dot: "bg-green-400" },
  { key: "cold",       label: "Frío",       dot: "bg-slate-500" },
  { key: "support",    label: "Soporte",    dot: "bg-purple-400" },
];

function displayName(c: Contact): string {
  if (c.name && c.name !== c.phone) return c.name;
  return `+${c.phone}`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
      .replace("alrededor de ", "")
      .replace("menos de un minuto", "ahora");
  } catch { return ""; }
}

export default function ContactList({ activePhone }: { activePhone?: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/contacts", { cache: "no-store" });
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  async function createContact() {
    const phone = newPhone.replace(/\D/g, "");
    if (!phone) return;
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name: newName || phone, session: "default", category: "prospect", sale_status: "none", last_message_at: new Date().toISOString() }),
    });
    if (res.ok) { setShowNew(false); setNewPhone(""); setNewName(""); await load(); router.push(`/conversations/${phone}`); }
  }

  const filtered = contacts.filter(c => {
    if (filter !== "all" && c.category !== filter) return false;
    const q = search.toLowerCase();
    if (q && !displayName(c).toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    return true;
  });

  const counts: Record<string, number> = { all: contacts.length };
  for (const c of contacts) counts[c.category] = (counts[c.category] ?? 0) + 1;

  const saleIcons: Record<string, string> = { none: "", close: "🔥", done: "✅" };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl">⚡</span>
            <span className="font-bold text-white">RyL Sports Vzla</span>
          </div>
          <button onClick={() => setShowNew(v => !v)}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-2.5 py-1 rounded-lg transition-colors">
            + Nuevo
          </button>
        </div>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Buscar por nombre o número..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* New contact */}
      {showNew && (
        <div className="mx-3 my-2 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs font-semibold text-amber-400 mb-2">Nuevo contacto</p>
          <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Teléfono con código de país (ej: 584121234567)" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Nombre (opcional)" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={createContact} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 rounded-lg">Crear</button>
            <button onClick={() => setShowNew(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="px-3 py-2 border-b border-slate-800 flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setFilter(cat.key)}
            className={clsx("text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
              filter === cat.key ? "bg-amber-500 text-black font-semibold" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", cat.dot)} />
            {cat.label}{counts[cat.key] ? ` (${counts[cat.key]})` : ""}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-6 text-center text-slate-500 text-sm">Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-slate-600 text-sm">
            <p className="text-3xl mb-2">📱</p>
            <p>Sin contactos. Los mensajes de WhatsApp aparecerán aquí automáticamente.</p>
          </div>
        )}
        {filtered.map(c => (
          <Link key={c.id} href={`/conversations/${c.phone}`}
            className={clsx("block px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors",
              activePhone === c.phone && "bg-slate-800 border-l-2 border-l-amber-500")}>
            <div className="flex items-start justify-between gap-2">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {displayName(c)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-semibold text-white truncate">{displayName(c)}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {saleIcons[c.sale_status] && <span className="text-xs">{saleIcons[c.sale_status]}</span>}
                    <span className="text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {c.last_message_preview || `+${c.phone}`}
                </p>
                <div className="mt-1">
                  <span className={clsx("text-xs px-1.5 py-0.5 rounded-full border font-medium", CATEGORY_COLORS[c.category])}>
                    {c.category === "prospect" ? "Prospecto" : c.category === "interested" ? "Interesado" :
                     c.category === "negotiating" ? "Negociando" : c.category === "sold" ? "Vendido" :
                     c.category === "cold" ? "Frío" : "Soporte"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
