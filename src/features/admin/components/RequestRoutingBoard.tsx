import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { RequestService } from "@/components/core/services/RequestService";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import { arabicDialectLabel } from "@/components/core/constants/arabic-dialects";

export function RequestRoutingBoard() {
  const queryClient = useQueryClient();
  const [creatorForRequest, setCreatorForRequest] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const requests = useQuery({ queryKey: ["requests", "admin"], queryFn: () => RequestService.getInstance().listForAdmin() });
  const portfolio = useQuery({ queryKey: ["portfolio", "approved"], queryFn: () => PortfolioService.getInstance().listApproved({}) });
  const route = useMutation({
    mutationFn: ({ requestId, creatorId, note }: { requestId: string; creatorId: string; note: string }) =>
      RequestService.getInstance().route(requestId, creatorId, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["requests", "admin"] });
      toast.success("تم توجيه الطلب إلى المبدع المختار.");
    },
    onError: (error) => {
      console.error("Request routing failed", error);
      toast.error("تعذّر توجيه هذا الطلب.");
    },
  });
  const deliveryReview = useMutation({
    mutationFn: ({ requestId, decision, note }: {
      requestId: string;
      decision: "DELIVERED" | "DELIVERY_REVISION_REQUIRED";
      note: string;
    }) => RequestService.getInstance().reviewDelivery(requestId, decision, note),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests", "admin"] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "creator"] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "client"] }),
      ]);
      toast.success(variables.decision === "DELIVERED"
        ? "تم اعتماد الملف وإتاحته للعلامة التجارية للتقييم."
        : "تم طلب تعديل الملف وإعادته إلى صانع المحتوى.");
    },
    onError: (error) => {
      console.error("Delivery review failed", error);
      toast.error("تعذّرت مراجعة ملف التسليم.");
    },
  });

  if (requests.isLoading || portfolio.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-muted" />;
  if (requests.isError || portfolio.isError) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">تعذّر تحميل الطلبات والمبدعين.</p>;
  const data = requests.data ?? [];
  if (!data.length) return <EmptyState title="لا توجد طلبات بعد" hint="ستظهر طلبات الحملات هنا عند إرسالها." />;

  return (
    <div className="space-y-4">
      {data.map((request) => {
        const canRoute = request.status === "SUBMITTED" || request.status === "UNDER_REVIEW";
        const canReviewDelivery = request.status === "DELIVERY_SUBMITTED" && !!request.delivery;
        return (
          <article key={request.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-semibold">طلب {request.id.slice(0, 8)}</h3><p className="mt-1 text-xs text-muted-foreground">العميل {request.clientId} · {request.itemIds.length} عنصر(عناصر)</p></div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{request.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.brief}</p>
            {request.dialects?.length ? <p className="mt-3 text-sm text-muted-foreground">اللهجات: {request.dialects.map(arabicDialectLabel).join("، ")}</p> : null}
            {request.adminNotes.length > 0 && <div className="mt-3 text-sm text-muted-foreground">ملاحظات الإدارة: {request.adminNotes.join(" · ")}</div>}
            {request.delivery && (
              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-semibold">ملف التسليم: {request.delivery.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  تاريخ الإرسال: {new Date(request.delivery.submittedAt).toLocaleString("ar")}
                </p>
                <a href={request.delivery.webViewLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand-700 underline">
                  فتح الملف للمراجعة
                </a>
              </div>
            )}
            {canRoute && (
              <div className="mt-5 grid gap-3 border-t pt-4 md:grid-cols-[1fr_1.4fr_auto]">
                <Select aria-label="اختر مبدعاً" value={creatorForRequest[request.id] ?? ""} onChange={(event) => setCreatorForRequest((current) => ({ ...current, [request.id]: event.target.value }))}>
                  <option value="">اختر مبدعاً</option>
                  {[...new Map((portfolio.data ?? [])
                    .filter((item) => request.itemIds.includes(item.id))
                    .map((item) => [item.creator.id, item.creator])).values()]
                    .map((creator) => <SelectItem key={creator.id} value={creator.id}>{creator.name} · {creator.category.replaceAll("_", " ")}</SelectItem>)}
                </Select>
                <input aria-label="ملاحظة توجيه داخلية" className="h-11 rounded-xl border border-border px-3 text-sm" placeholder="ملاحظة داخلية (اختيارية)" value={notes[request.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} />
                <Button disabled={!creatorForRequest[request.id] || route.isPending} onClick={() => route.mutate({ requestId: request.id, creatorId: creatorForRequest[request.id]!, note: notes[request.id] ?? "" })}>توجيه الطلب</Button>
              </div>
            )}
            {canReviewDelivery && (
              <div className="mt-5 space-y-3 border-t pt-4">
                <label className="block text-sm font-medium" htmlFor={`delivery-note-${request.id}`}>
                  ملاحظة لصانع المحتوى عند طلب التعديل (اختياري)
                </label>
                <input
                  id={`delivery-note-${request.id}`}
                  className="h-11 w-full rounded-xl border border-border px-3 text-sm"
                  placeholder="مثال: يرجى تعديل الإضاءة أو إعادة رفع الملف بالجودة المطلوبة"
                  value={notes[request.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={deliveryReview.isPending}
                    onClick={() => deliveryReview.mutate({
                      requestId: request.id,
                      decision: "DELIVERY_REVISION_REQUIRED",
                      note: notes[request.id] ?? "",
                    })}
                  >
                    طلب تعديل وإعادة إرسال
                  </Button>
                  <Button
                    disabled={deliveryReview.isPending}
                    onClick={() => deliveryReview.mutate({ requestId: request.id, decision: "DELIVERED", note: "" })}
                  >
                    اعتماد وإرسال للعلامة التجارية
                  </Button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}