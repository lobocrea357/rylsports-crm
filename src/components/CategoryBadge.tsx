"use client";
import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from "@/lib/pocketbase";

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
