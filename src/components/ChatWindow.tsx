"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PBMessage {
  id: string;
  content: string;
  from_me: boolean;
  timestamp: string;
  message_type: string;
}

export default function ChatWindow({ phone }: { phone: string }) {
  const [messages, setMessages] = useState<PBMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?phone=${phone}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    }
  }, [phone]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text: text.trim() }),
      });
      if (res.ok) {
        setText("");
        setTimeout(load, 1500);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-sm mt-16">
            <p className="text-2xl mb-2">💬</p>
            <p>Sin mensajes aún. Los mensajes aparecerán aquí cuando lleguen por WhatsApp.</p>
          </div>
        )}
        {messages.map((m) => {
          const ts = m.timestamp ? new Date(m.timestamp) : new Date();
          return (
            <div key={m.id} className={`flex ${m.from_me ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  m.from_me
                    ? "bg-amber-500 text-black rounded-br-sm"
                    : "bg-slate-700 text-slate-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {m.content || <em className="opacity-50">[{m.message_type}]</em>}
                </p>
                <p className={`text-xs mt-1 ${m.from_me ? "text-black/50" : "text-slate-500"}`}>
                  {format(ts, "dd MMM HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-800 flex gap-2">
        <textarea
          className="flex-1 bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500 resize-none"
          placeholder="Escribe un mensaje..."
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold px-4 rounded-xl transition-colors text-sm"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
