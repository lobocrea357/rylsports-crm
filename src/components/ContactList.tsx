"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import CategoryBadge from "./CategoryBadge";
import SaleStatusBadge from "./SaleStatusBadge";
import type { Contact, Category } from "@/lib/pocketbase";

const CATEGORIES: Array<{ key: Category | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "prospect", label: "Prospecto" },
  { key: "interested", label: "Interesado" },
  { key: "negotiating", label: "Negociando" },
  { key: "sold", label: "Vendido" },
  { key: "cold", label: "Frío" },
  { key: "support", label: "Soporte" },
];

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

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  async function createContact() {
    if (!newPhone.trim()) return;
    const phone = newPhone.replace(/\D/g, "");
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        name: newName || phone,
        session: "default",
        category: "prospect",
        sale_status: "none",
        last_message_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      setShowNew(false);
      setNewPhone(""); setNewName("");
      await load();
      router.push(`/conversations/${phone}`);
    }
  }

  const filtered = contacts.filter((c) => {
    if (filter !== "all" && c.category !== filter) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.phone?.includes(search)) return false;
    return true;
  });

  const counts: Record<string, number> = { all: contacts.length };
  for (const c of contacts) counts[c.category] = (counts[c.category] ?? 0) + 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-xl font-bold">⚡</span>
            <span className="font-bold text-white text-sm">RyL Sports Vzla</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-2 py-1 rounded-lg transition-colors"
            title="Nuevo contacto"
          >
            + Nuevo
          </button>
        </div>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Buscar contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* New contact modal */}
      {showNew && (
        <div className="mx-3 my-2 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs font-semibold text-slate-300 mb-2">Nuevo contacto</p>
          <input
            className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Teléfono (ej: 584121234567)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <input
            className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Nombre (opcional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={createContact} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 rounded-lg">
              Crear
            </button>
            <button onClick={() => setShowNew(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="px-2 py-2 border-b border-slate-800 flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={clsx(
              "text-xs px-2 py-1 rounded-full transition-colors",
              filter === cat.key
                ? "bg-amber-500 text-black font-semibold"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {cat.label} {counts[cat.key] ? `(${counts[cat.key]})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-4 text-slate-500 text-sm text-center">Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-slate-600 text-sm text-center">
            <p className="text-2xl mb-2">📱</p>
            <p>Los contactos aparecerán aquí cuando lleguen mensajes por WhatsApp, o puedes crear uno manualmente.</p>
          </div>
        )}
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/conversations/${c.phone}`}
            className={clsx(
              "block px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors",
              activePhone === c.phone && "bg-slate-800 border-l-2 border-l-amber-500"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name || c.phone}</p>
                <p className="text-xs text-slate-500 truncate">{c.phone}</p>
              </div>
              <div className="shrink-0">
                <CategoryBadge category={c.category} />
              </div>
            </div>
            <div className="mt-1">
              <SaleStatusBadge status={c.sale_status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
