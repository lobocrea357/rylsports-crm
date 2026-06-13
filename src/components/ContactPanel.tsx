"use client";
import { useState } from "react";
import CategoryBadge from "./CategoryBadge";
import SaleStatusBadge from "./SaleStatusBadge";
import type { Contact, Category, SaleStatus } from "@/lib/pocketbase";
import { CATEGORY_LABELS, SALE_STATUS_LABELS } from "@/lib/pocketbase";

interface Props {
  contact: Contact;
  onUpdate: (updated: Partial<Contact>) => void;
}

export default function ContactPanel({ contact, onUpdate }: Props) {
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [name, setName] = useState(contact.name ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(extra?: Partial<Contact>) {
    setSaving(true);
    const payload = { name, notes, ...extra };
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) onUpdate(payload);
    setSaving(false);
  }

  async function analyze() {
    setAnalyzing(true);
    const res = await fetch("/api/ai/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: contact.phone, contactId: contact.id }),
    });
    if (res.ok) {
      const data = await res.json();
      onUpdate({ category: data.category, sale_status: data.sale_status, ai_summary: data.summary });
    }
    setAnalyzing(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Name */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider">Nombre</label>
        <input
          className="w-full mt-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save()}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider">Teléfono</label>
        <p className="mt-1 text-sm text-slate-300">{contact.phone}</p>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider">Categoría</label>
        <div className="mt-1">
          <CategoryBadge category={contact.category} />
        </div>
        <select
          className="mt-2 w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500"
          value={contact.category}
          onChange={(e) => save({ category: e.target.value as Category })}
        >
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((k) => (
            <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Sale Status */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider">Estado de venta</label>
        <div className="mt-1">
          <SaleStatusBadge status={contact.sale_status} />
        </div>
        <select
          className="mt-2 w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500"
          value={contact.sale_status}
          onChange={(e) => save({ sale_status: e.target.value as SaleStatus })}
        >
          {(Object.keys(SALE_STATUS_LABELS) as SaleStatus[]).map((k) => (
            <option key={k} value={k}>{SALE_STATUS_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* AI Summary */}
      {contact.ai_summary && (
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider">Resumen IA</label>
          <p className="mt-1 text-sm text-slate-300 bg-slate-800/50 rounded-lg p-2 leading-relaxed">
            {contact.ai_summary}
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider">Notas</label>
        <textarea
          className="mt-1 w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          rows={4}
          placeholder="Agrega notas sobre este cliente..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => save()}
        />
      </div>

      {/* Actions */}
      <button
        onClick={analyze}
        disabled={analyzing}
        className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {analyzing ? "Analizando..." : "✨ Analizar con IA"}
      </button>

      {saving && <p className="text-xs text-slate-500 text-center">Guardando...</p>}
    </div>
  );
}
