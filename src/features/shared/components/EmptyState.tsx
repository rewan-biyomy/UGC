// src/features/shared/components/EmptyState.tsx
import { SearchX } from "lucide-react";

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid flex-1 place-items-center rounded-3xl border border-dashed bg-white/60 px-6 py-20 text-center">
      <div>
        <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}