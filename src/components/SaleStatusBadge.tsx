"use client";
import { SALE_STATUS_LABELS, SALE_STATUS_COLORS, type SaleStatus } from "@/lib/pocketbase";

export default function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const icons: Record<SaleStatus, string> = { none: "○", close: "◉", done: "✓" };
  return (
    <span className={`text-xs font-medium ${SALE_STATUS_COLORS[status]}`}>
      {icons[status]} {SALE_STATUS_LABELS[status]}
    </span>
  );
}
