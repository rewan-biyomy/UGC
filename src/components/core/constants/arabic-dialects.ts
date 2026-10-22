export const ARABIC_DIALECTS = [
  { id: "modern-standard", label: "العربية الفصحى" },
  { id: "egyptian", label: "المصرية" },
  { id: "gulf", label: "الخليجية" },
  { id: "saudi", label: "السعودية" },
  { id: "emirati", label: "الإماراتية" },
  { id: "kuwaiti", label: "الكويتية" },
  { id: "qatari", label: "القطرية" },
  { id: "bahraini", label: "البحرينية" },
  { id: "omani", label: "العُمانية" },
  { id: "levantine", label: "الشامية" },
  { id: "lebanese", label: "اللبنانية" },
  { id: "syrian", label: "السورية" },
  { id: "jordanian", label: "الأردنية" },
  { id: "palestinian", label: "الفلسطينية" },
  { id: "iraqi", label: "العراقية" },
  { id: "yemeni", label: "اليمنية" },
  { id: "sudanese", label: "السودانية" },
  { id: "maghrebi", label: "المغاربية" },
  { id: "moroccan", label: "المغربية" },
  { id: "algerian", label: "الجزائرية" },
  { id: "tunisian", label: "التونسية" },
  { id: "libyan", label: "الليبية" },
] as const;

export type ArabicDialect = (typeof ARABIC_DIALECTS)[number]["id"];

export function arabicDialectLabel(id: string): string {
  return ARABIC_DIALECTS.find((dialect) => dialect.id === id)?.label ?? id;
}
