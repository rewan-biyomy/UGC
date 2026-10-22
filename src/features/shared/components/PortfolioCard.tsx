import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";
import type { PortfolioItem } from "@/components/core/models/PortfolioItem";
import { driveThumbnailUrl } from "@/lib/google";
import { cn } from "@/lib/utils";
import { LazyImage } from "./LazyMedia";
import { StatusBadge } from "./StatusBadge";

interface PortfolioCardProps {
  item: PortfolioItem;
  actions?: ReactNode;
  onSelect?: () => void;
}

export function PortfolioCard({ item, actions, onSelect }: PortfolioCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const thumbnailUrl = item.thumbnailUrl ?? driveThumbnailUrl(item.driveFileId);
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className={cn("group overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg")}>
        <div className="block aspect-[4/5] w-full overflow-hidden bg-muted">
          {item.isVerticalVideo ? (
            <iframe
              src={`https://drive.google.com/file/d/${encodeURIComponent(item.driveFileId)}/preview`}
              title={`فيديو من أعمال ${item.creator.name}`}
              className="h-full w-full border-0"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <LazyImage src={thumbnailUrl} alt={`عمل من أعمال ${item.creator.name}`} />
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <button type="button" className="truncate text-left font-semibold hover:text-brand-700" onClick={onSelect} disabled={!onSelect}>{item.creator.name}</button>
              <p className="text-xs text-muted-foreground">{item.creator.category.replaceAll("_", " ")}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-amber-600">★ {item.creator.rating.toFixed(1)}</span>
          </div>
          {item.status !== "APPROVED" && <StatusBadge status={item.status} />}
          {actions}
        </div>
      </Card>
    </motion.div>
  );
}