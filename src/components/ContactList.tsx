"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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

  const load = useCallback(async () => {
    const res = await fetch("/api/contacts", { cache: "no-store" });
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const filtered = contacts.filter((c) => {
    if (filter !== "all" && c.category !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    return true;
  });

  const counts: Record<string, number> = { all: contacts.length };
  for (const c of contacts) counts[c.category] = (counts[c.category] ?? 0) + 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-xl font-bold">⚡</span>
          <span className="font-bold text-white text-sm">RyL Sports Vzla</span>
        </div>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Buscar contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
        {loading && <div className="p-4 text-slate-500 text-sm">Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-4 text-slate-500 text-sm">No hay contactos</div>
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
              <div className="flex flex-col items-end gap-1 shrink-0">
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
