import PocketBase from "pocketbase";

const PB_URL = process.env.POCKETBASE_URL ?? "http://localhost:8090";

let _adminPb: PocketBase | null = null;

export async function getAdminPb(): Promise<PocketBase> {
  if (_adminPb?.authStore.isValid) return _adminPb;
  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  _adminPb = pb;
  return pb;
}

export function getPb(): PocketBase {
  return new PocketBase(PB_URL);
}

export type Category = "prospect" | "interested" | "negotiating" | "sold" | "cold" | "support";
export type SaleStatus = "none" | "close" | "done";

export interface Contact {
  id: string;
  phone: string;
  name: string;
  session: string;
  category: Category;
  sale_status: SaleStatus;
  ai_summary: string;
  notes: string;
  last_message_at: string;
  last_message_preview: string;
  read: boolean;
}

export interface Message {
  id: string;
  contact: string;
  waha_message_id: string;
  content: string;
  from_me: boolean;
  timestamp: string;
  message_type: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  prospect: "Prospecto",
  interested: "Interesado",
  negotiating: "Negociando",
  sold: "Vendido",
  cold: "Frío",
  support: "Soporte",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  prospect: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  interested: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  negotiating: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sold: "bg-green-500/20 text-green-300 border-green-500/30",
  cold: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  support: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  none: "Sin venta",
  close: "Venta próxima",
  done: "Venta realizada",
};

export const SALE_STATUS_COLORS: Record<SaleStatus, string> = {
  none: "text-slate-400",
  close: "text-amber-400",
  done: "text-green-400",
};
