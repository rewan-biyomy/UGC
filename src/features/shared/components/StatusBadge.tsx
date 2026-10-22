import { Badge } from "@/components/ui/badge";
import type { ModerationStatus } from "@/components/core/models/PortfolioItem";
import { cn } from "@/lib/utils";

const styles: Record<ModerationStatus, string> = {
  PENDING: "border border-amber-200 bg-amber-100 text-amber-800",
  APPROVED: "border border-emerald-200 bg-emerald-100 text-emerald-800",
  REJECTED: "border border-rose-200 bg-rose-100 text-rose-800",
};

export function StatusBadge({ status, className }: { status: ModerationStatus; className?: string }) {
  return <Badge className={cn("pointer-events-none", styles[status], className)}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}