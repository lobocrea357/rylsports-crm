"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Contact } from "@/lib/pocketbase";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/pocketbase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Filter = "all" | "unread";

function displayName(c: Contact): string {
  if (c.name && c.name !== c.phone) return c.name;
  return `+${c.phone}`;
}

function initials(name: string): string {
  const parts = name.replace("+", "").split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: false })
      .replace("alrededor de ", "").replace("menos de un minuto", "ahora")
      .replace("1 minuto", "1 min").replace(" minutos", " min")
      .replace(" horas", "h").replace("1 hora", "1h")
      .replace(" días", "d").replace("1 día", "1d");
  } catch { return ""; }
}

const AVATAR_COLORS = [
  "bg-blue-600","bg-violet-600","bg-emerald-600","bg-rose-600",
  "bg-amber-600","bg-cyan-600","bg-pink-600","bg-indigo-600",
];
function avatarColor(phone: string): string {
  const n = phone.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export default function ContactList({ activePhone }: { activePhone?: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
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

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  async function createContact() {
    const phone = newPhone.replace(/\D/g, "");
    if (!phone) return;
    const res = await fetch("/api/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name: newName || phone, session: "default", category: "prospect", sale_status: "none", read: true, last_message_at: new Date().toISOString() }),
    });
    if (res.ok) { setShowNew(false); setNewPhone(""); setNewName(""); await load(); router.push(`/conversations/${phone}`); }
  }

  const filtered = contacts.filter(c => {
    if (filter === "unread" && c.read !== false) return false;
    const q = search.toLowerCase();
    if (q && !displayName(c).toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    return true;
  });

  const unreadCount = contacts.filter(c => c.read === false).length;
  const saleIcons: Record<string, string> = { none: "", close: "🔥", done: "✅" };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60">
      <div className="px-4 pt-5 pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-black text-base font-bold">⚡</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">RyL Sports</p>
              <p className="text-slate-500 text-xs mt-0.5">Vzla CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowNew(v => !v)} className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg transition-colors">+ Nuevo</button>
            <button onClick={logout} title="Cerrar sesión" className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.571a.75.75 0 000 1.046l2.5 2.571a.75.75 0 101.004-1.114l-1.048-1.079h9.546A.75.75 0 0019 10z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors" placeholder="Buscar contacto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {showNew && (
        <div className="mx-3 my-2 bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <p className="text-xs font-semibold text-amber-400 mb-2">Nuevo contacto</p>
          <input className="w-full bg-slate-700/60 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500 border border-transparent" placeholder="Teléfono con código de país (ej: 584121234567)" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          <input className="w-full bg-slate-700/60 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500 border border-transparent" placeholder="Nombre (opcional)" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={createContact} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 rounded-lg">Crear</button>
            <button onClick={() => setShowNew(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-1.5 rounded-lg hover:bg-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      <div className="px-3 py-2.5 flex gap-1.5 border-b border-slate-800/60">
        <button onClick={() => setFilter("all")} className={clsx("flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors", filter === "all" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50")}>
          Todos ({contacts.length})
        </button>
        <button onClick={() => setFilter("unread")} className={clsx("flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5", filter === "unread" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50")}>
          No leídos
          {unreadCount > 0 && <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded-full", filter === "unread" ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300")}>{unreadCount}</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-full shrink-0"/>
                <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-slate-800 rounded w-2/3"/><div className="h-2.5 bg-slate-800 rounded w-1/2"/></div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-slate-600">
            <p className="text-4xl mb-3">{filter === "unread" ? "✅" : "📱"}</p>
            <p className="text-sm">{filter === "unread" ? "Todo al día. Sin mensajes nuevos." : "Los mensajes de WhatsApp aparecerán aquí."}</p>
          </div>
        )}
        {filtered.map(c => {
          const isUnread = c.read === false;
          const name = displayName(c);
          return (
            <Link key={c.id} href={`/conversations/${c.phone}`}
              className={clsx("flex items-center gap-3 px-4 py-3 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors", activePhone === c.phone && "bg-slate-800/60 border-l-2 border-l-amber-500 pl-3.5")}>
              <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 relative", avatarColor(c.phone))}>
                {initials(name)}
                {isUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-slate-950 rounded-full"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={clsx("text-sm truncate", isUnread ? "font-bold text-white" : "font-medium text-slate-300")}>{name}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {saleIcons[c.sale_status] && <span className="text-xs">{saleIcons[c.sale_status]}</span>}
                    <span className="text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                  </div>
                </div>
                <p className={clsx("text-xs truncate mt-0.5", isUnread ? "text-slate-300" : "text-slate-500")}>{c.last_message_preview || `+${c.phone}`}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={clsx("text-xs px-1.5 py-0.5 rounded-md border font-medium", CATEGORY_COLORS[c.category])}>{CATEGORY_LABELS[c.category]}</span>
                  {isUnread && <span className="text-xs text-amber-400 font-semibold">● nuevo</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
