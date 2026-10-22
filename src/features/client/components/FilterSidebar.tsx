import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreatorCategory, CREATOR_CATEGORY_LABELS } from "@/components/core/constants/roles";
import { NICHES } from "@/components/core/constants/niches";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/features/shared/hooks/useDebouncedValue";

export function FilterSidebar() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedQuery.trim()) next.set("q", debouncedQuery.trim());
    else next.delete("q");
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [debouncedQuery, params, setParams]);

  const toggle = (key: "niche" | "category", value: string, checked: boolean) => {
    const next = new URLSearchParams(params);
    const selected = next.getAll(key).filter((item) => item !== value);
    if (checked) selected.push(value);
    next.delete(key);
    selected.forEach((item) => next.append(key, item));
    setParams(next, { replace: true });
  };

  const renderFilters = (suffix: string) => (
    <>
      <Label htmlFor={`creator-search-${suffix}`} className="mt-4 block">البحث</Label>
      <input id={`creator-search-${suffix}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اسم أو كلمة مفتاحية" className="mt-2 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand-500" />
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">المجالات</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{NICHES.map((niche) => <label key={niche.id} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={params.getAll("niche").includes(niche.id)} onChange={(event) => toggle("niche", niche.id, event.target.checked)} />
          {niche.label}
        </label>)}</div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">نوع المبدع</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{Object.values(CreatorCategory).map((category) => <label key={category} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={params.getAll("category").includes(category)} onChange={(event) => toggle("category", category, event.target.checked)} />
          {CREATOR_CATEGORY_LABELS[category]}
        </label>)}</div>
      </fieldset>
      <label className="mt-5 block text-sm font-semibold" htmlFor={`rating-filter-${suffix}`}>أدنى تقييم</label>
      <select id={`rating-filter-${suffix}`} value={params.get("minRating") ?? ""} onChange={(event) => {
        const next = new URLSearchParams(params);
        if (event.target.value) next.set("minRating", event.target.value);
        else next.delete("minRating");
        setParams(next, { replace: true });
      }} className="mt-2 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm">
        <option value="">أي تقييم</option>
        <option value="4">4.0+</option>
        <option value="4.5">4.5+</option>
        <option value="4.8">4.8+</option>
      </select>
      <button type="button" className="mt-5 text-sm font-semibold text-brand-700 hover:underline" onClick={() => { setQuery(""); setParams(new URLSearchParams(), { replace: true }); }}>مسح جميع الفلاتر</button>
    </>
  );

  return (
    <>
      <details dir="rtl" className="w-full rounded-2xl border bg-white p-4 lg:hidden">
        <summary className="cursor-pointer font-semibold">البحث والفلاتر</summary>
        <div className="pt-2">{renderFilters("mobile")}</div>
      </details>
      <aside dir="rtl" className="hidden w-64 shrink-0 rounded-2xl border bg-white p-5 lg:block">
        <h2 className="font-semibold">الفلاتر</h2>
        {renderFilters("desktop")}
      </aside>
    </>
  );
}