import ContactList from "@/components/ContactList";

export default function Home() {
  return (
    <div className="flex h-screen">
      <aside className="w-80 shrink-0 border-r border-slate-800 h-full overflow-hidden">
        <ContactList />
      </aside>
      <main className="flex-1 flex items-center justify-center text-slate-600">
        <div className="text-center">
          <p className="text-4xl mb-3">⚡</p>
          <p className="text-lg font-semibold text-slate-400">RyL Sports Vzla CRM</p>
          <p className="text-sm mt-1">Selecciona una conversación para comenzar</p>
        </div>
      </main>
    </div>
  );
}
