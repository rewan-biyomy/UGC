// src/core/constants/niches.ts
export interface Niche { id: string; label: string; }

export const NICHES: readonly Niche[] = [
  { id: "religious", label: "ديني" },
  { id: "beauty",    label: "الجمال والعناية" },
  { id: "tech",      label: "التقنية" },
  { id: "fashion",   label: "الأزياء" },
  { id: "food",      label: "الطعام والضيافة" },
  { id: "fitness",   label: "اللياقة البدنية" },
] as const;

export const nicheLabel = (id: string): string =>
  NICHES.find((n) => n.id === id)?.label ?? id;