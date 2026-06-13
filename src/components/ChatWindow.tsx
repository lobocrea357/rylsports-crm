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
  media_url?: string;
  media_mime?: string;
}

function MediaContent({ url, mime, type }: { url: string; mime: string; type: string }) {
  const proxyUrl = `/api/media?url=${encodeURIComponent(url)}`;
  const isImage = mime.startsWith("image/") || type === "image" || type === "sticker";
  const isAudio = mime.startsWith("audio/") || type === "audio" || type === "ptt" || type === "voice";
  const isVideo = mime.startsWith("video/") || type === "video";

  if (isImage) {
    return (
      <a href={proxyUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={proxyUrl}
          alt="Imagen"
          className="max-w-xs rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </a>
    );
  }
  if (isAudio) {
    return (
      <audio controls className="mt-1 max-w-xs" style={{ height: 36 }}>
        <source src={proxyUrl} type={mime || "audio/ogg"} />
      </audio>
    );
  }
  if (isVideo) {
    return (
      <video controls className="max-w-xs rounded-lg mt-1">
        <source src={proxyUrl} type={mime || "video/mp4"} />
      </video>
    );
  }
  // Document / other
  return (
    <a
      href={proxyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex items-center gap-2 text-xs underline opacity-80 hover:opacity-100"
    >
      📎 Descargar archivo
    </a>
  );
}

export default function ChatWindow({ phone }: { phone: string }) {
  const [messages, setMessages] = useState<PBMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?phone=${phone}`, { cache: "no-store" });
    if (res.ok) setMessages(await res.json());
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
      if (res.ok) { setText(""); setTimeout(load, 1500); }
    } finally {
      setSending(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-sm mt-16">
            <p className="text-3xl mb-2">💬</p>
            <p>Los mensajes aparecerán aquí cuando lleguen por WhatsApp.</p>
          </div>
        )}
        {messages.map((m) => {
          const ts = m.timestamp ? new Date(m.timestamp) : new Date();
          const hasMedia = !!m.media_url;
          return (
            <div key={m.id} className={`flex ${m.from_me ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  m.from_me
                    ? "bg-amber-500 text-black rounded-br-sm"
                    : "bg-slate-700 text-slate-100 rounded-bl-sm"
                }`}
              >
                {hasMedia && (
                  <MediaContent
                    url={m.media_url!}
                    mime={m.media_mime ?? ""}
                    type={m.message_type}
                  />
                )}
                {m.content && (
                  <p className="whitespace-pre-wrap break-words mt-1">{m.content}</p>
                )}
                {!m.content && !hasMedia && (
                  <p className="italic opacity-50">[{m.message_type}]</p>
                )}
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
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
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
