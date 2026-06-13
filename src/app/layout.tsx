import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RyL Sports Vzla - CRM",
  description: "CRM de WhatsApp para RyL Sports Vzla",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
