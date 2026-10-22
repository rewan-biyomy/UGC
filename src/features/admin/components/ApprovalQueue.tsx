import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { PortfolioCard } from "@/features/shared/components/PortfolioCard";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import type { ModerationStatus } from "@/components/core/models/PortfolioItem";

export function ApprovalQueue() {
  const queryClient = useQueryClient();
  const pending = useQuery({
    queryKey: ["portfolio", "pending"],
    queryFn: () => PortfolioService.getInstance().listPending(),
  });
  const moderation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: Extract<ModerationStatus, "APPROVED" | "REJECTED"> }) =>
      PortfolioService.getInstance().moderate(id, decision),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio", "pending"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio", "approved"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio", "creator-profile"] }),
      ]);
      toast.success(`تم ${variables.decision === "APPROVED" ? "موافقة" : "رفض"} العنصر.`);
    },
    onError: (error) => {
      console.error("Portfolio moderation failed", error);
      toast.error("Could not update this portfolio item.");
    },
  });

  if (pending.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-muted" />;
  if (pending.isError) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">تعذّر تحميل الأعمال المعلقة.</p>;
  if (!pending.data?.length) return <EmptyState title="لا توجد أعمال لمراجعتها" hint="ستظهر الطلبات الجديدة هنا." />;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pending.data.map((item) => (
        <PortfolioCard key={item.id} item={item} actions={
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-500" disabled={moderation.isPending} onClick={() => moderation.mutate({ id: item.id, decision: "APPROVED" })}><Check size={15} /> موافقة</Button>
            <Button size="sm" variant="destructive" className="flex-1" disabled={moderation.isPending} onClick={() => moderation.mutate({ id: item.id, decision: "REJECTED" })}><X size={15} /> رفض</Button>
          </div>
        } />
      ))}
    </div>
  );
}