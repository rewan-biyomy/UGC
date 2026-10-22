import { Star, X } from "lucide-react";
import type { CreatorSnapshot } from "@/components/core/models/PortfolioItem";
import { nicheLabel } from "@/components/core/constants/niches";
import { Button } from "@/components/ui/button";

export function CreatorProfilePanel({ creator, open, onClose }: { creator: CreatorSnapshot | null; open: boolean; onClose: () => void }) {
  if (!open || !creator) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink-950/50" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-7 shadow-2xl" aria-label={`${creator.name} profile`}>
        <div className="flex justify-end"><Button variant="ghost" size="icon" aria-label="Close profile" onClick={onClose}><X /></Button></div>
        <div className="mt-5 text-center">
          <img src={creator.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}`} alt="" className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-brand-100" />
          <h2 className="mt-5 text-2xl font-bold">{creator.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{creator.category.replaceAll("_", " ")}</p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700"><Star size={15} fill="currentColor" /> {creator.rating.toFixed(1)} creator rating</p>
        </div>
        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold">Niches</h3>
          <div className="mt-3 flex flex-wrap gap-2">{creator.nicheIds.map((id) => <span key={id} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">{nicheLabel(id)}</span>)}</div>
          <p className="mt-7 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">Interested in working together? Add a portfolio item to a package and our admin team will coordinate the request.</p>
        </div>
      </aside>
    </div>
  );
}