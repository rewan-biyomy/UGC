import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { RequestService } from "@/components/core/services/RequestService";
import { arabicDialectLabel } from "@/components/core/constants/arabic-dialects";
import type { CreatorUser } from "@/components/core/models/User";
import { DeliveryUploader } from "./DeliveryUploader";

export function CreatorRequests({ creator }: { creator: CreatorUser }) {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["requests", "creator", creator.id],
    queryFn: () => RequestService.getInstance().listForCreator(creator.id),
  });
  const response = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "ACCEPTED" | "DECLINED" }) =>
      RequestService.getInstance().respond(id, creator.id, decision),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests", "creator", creator.id] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "admin"] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "client"] }),
      ]);
      toast.success(variables.decision === "ACCEPTED" ? "تم قبول الطلب وإبلاغ المنصة." : "تم رفض الطلب وإبلاغ المنصة.");
    },
    onError: (error) => {
      console.error("Creator request response failed", error);
      toast.error("تعذّر إرسال ردك. حاول مرة أخرى.");
    },
  });
  const refreshAfterDelivery = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["requests", "creator", creator.id] }),
      queryClient.invalidateQueries({ queryKey: ["requests", "admin"] }),
    ]);
  };

  if (requests.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-white" />;
  if (requests.isError) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">تعذّر تحميل الطلبات الواردة.</p>;
  if (!requests.data?.length) return <EmptyState title="لا توجد طلبات جديدة" hint="ستظهر هنا طلبات العملاء التي توجّهها المنصة إليك." />;

  return (
    <div className="space-y-4">
      {requests.data.map((request) => (
        <article key={request.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">طلب جديد من المنصة</h2>
              <p className="mt-1 text-xs text-muted-foreground">{request.itemIds.length} عمل · {request.createdAt.toLocaleDateString("ar")}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {request.status === "ROUTED" ? "بانتظار ردك"
                : request.status === "ACCEPTED" ? "مقبول - بانتظار التسليم"
                  : request.status === "DELIVERY_SUBMITTED" ? "قيد مراجعة المنصة"
                    : "مطلوب تعديل الملف وإعادة إرساله"}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.brief}</p>
          {request.dialects?.length ? <p className="mt-3 text-sm text-muted-foreground">اللهجات المطلوبة: {request.dialects.map(arabicDialectLabel).join("، ")}</p> : null}
          {request.deliveryFeedback && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">ملاحظات المنصة: {request.deliveryFeedback}</p>}
          {request.delivery && <a href={request.delivery.webViewLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand-700 underline">عرض الملف المرسل: {request.delivery.fileName}</a>}
          {request.status === "ROUTED" && (
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button variant="destructive" disabled={response.isPending} onClick={() => response.mutate({ id: request.id, decision: "DECLINED" })}>
                <X size={16} /> رفض الطلب
              </Button>
              <Button disabled={response.isPending} onClick={() => response.mutate({ id: request.id, decision: "ACCEPTED" })}>
                <Check size={16} /> قبول الطلب
              </Button>
            </div>
          )}
          {(request.status === "ACCEPTED" || request.status === "DELIVERY_REVISION_REQUIRED") && (
            <DeliveryUploader requestId={request.id} creatorId={creator.id} onUploaded={refreshAfterDelivery} />
          )}
          <p className="mt-3 text-xs text-muted-foreground">ردك يُرسل إلى المنصة فقط. لا تتواصل المنصة مباشرةً بينك وبين العميل.</p>
        </article>
      ))}
    </div>
  );
}
