"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ContactList from "@/components/ContactList";
import ChatWindow from "@/components/ChatWindow";
import ContactPanel from "@/components/ContactPanel";
import CategoryBadge from "@/components/CategoryBadge";
import SaleStatusBadge from "@/components/SaleStatusBadge";
import type { Contact } from "@/lib/pocketbase";

export default function ConversationPage() {
  const { phone } = useParams<{ phone: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((contacts: Contact[]) => {
        const found = contacts.find((c) => c.phone === phone);
        if (found) setContact(found);
      });
  }, [phone]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-slate-800 h-full overflow-hidden">
        <ContactList activePhone={phone} />
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
              {(contact?.name || phone)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{contact?.name || phone}</p>
              <p className="text-xs text-slate-500 truncate">{phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {contact && <CategoryBadge category={contact.category} />}
            {contact && <SaleStatusBadge status={contact.sale_status} />}
            <button
              onClick={() => setShowPanel((v) => !v)}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-300"
            >
              {showPanel ? "Ocultar info" : "Ver info"}
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <ChatWindow phone={phone} />
          </div>

          {/* Contact panel */}
          {showPanel && contact && (
            <aside className="w-72 shrink-0 border-l border-slate-800 overflow-hidden">
              <ContactPanel
                contact={contact}
                onUpdate={(updated) => setContact((c) => c ? { ...c, ...updated } : c)}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
