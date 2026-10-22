import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/use-auth";
import { ClientUser } from "@/components/core/models/User";
import { RequestService } from "@/components/core/services/RequestService";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { FloatingDashboardMenu } from "@/features/shared/components/FloatingDashboardMenu";

const statusLabels: Record<string, string> = {
  SUBMITTED: "قيد مراجعة المنصة",
  UNDER_REVIEW: "قيد مراجعة المنصة",
  ROUTED: "أُرسل إلى صانع المحتوى",
  ACCEPTED: "قبله صانع المحتوى",
  DECLINED: "اعتذر صانع المحتوى",
  DELIVERY_SUBMITTED: "ملف التسليم قيد مراجعة المنصة",
  DELIVERY_REVISION_REQUIRED: "المنصة طلبت تعديلاً",
  DELIVERED: "تم اعتماد التسليم - بانتظار تقييمك",
  COMPLETED: "مكتمل وتم تقييمه",
  REJECTED: "مرفوض",
};

export function ClientRequestsPage() {
  const { user, signOut } = useAuth();
  const client = user instanceof ClientUser ? user : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const requests = useQuery({
    queryKey: ["requests", "client", client?.id],
    queryFn: () => RequestService.getInstance().listForClient(client?.id ?? ""),
    enabled: !!client,
  });
  const portfolio = useQuery({
    queryKey: ["portfolio", "approved"],
    queryFn: () => PortfolioService.getInstance().listApproved({}),
    enabled: !!client,
  });
  const rate = useMutation({
    mutationFn: ({ requestId, value, comment }: { requestId: string; value: number; comment: string }) => {
      if (!client) throw new Error("يلزم تسجيل الدخول بحساب علامة تجارية.");
      return RequestService.getInstance().rate(requestId, client.id, value, comment, client.brandName ?? client.name);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests", "client", client?.id] }),
        queryClient.invalidateQueries({ queryKey: ["requests", "admin"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
        queryClient.invalidateQueries({ queryKey: ["creator", "reviews"] }),
      ]);
      toast.success("تم تسجيل تقييمك واحتسابه ضمن تقييم صانع المحتوى.");
    },
    onError: (error) => {
      console.error("Client creator rating failed", error);
      toast.error(error instanceof Error ? error.message : "تعذّر حفظ التقييم.");
    },
  });

  if (!client) return <Navigate to="/auth" replace />;

  const creatorNames = new Map((portfolio.data ?? []).map((item) => [item.creator.id, item.creator.name]));

  return (
    <main dir="rtl" className="min-h-screen bg-muted/40">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-brand-600">{client.brandName ?? "UGC Market"}</p>
            <h1 className="text-xl font-bold">طلبات حملاتي</h1>
          </div>
          <Button className="hidden sm:inline-flex" variant="outline" onClick={() => navigate("/client")}>العودة إلى التصفح</Button>
        </div>
      </header>
      <FloatingDashboardMenu items={[
        { label: "تصفح المبدعين", to: "/client" },
        { label: "طلباتي", to: "/client/requests" },
        { label: "تسجيل الخروج", onSelect: signOut },
      ]} />
      <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        {requests.isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        ) : requests.isError ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">تعذّر تحميل طلباتك.</p>
        ) : requests.data?.length ? requests.data.map((request) => (
          <article key={request.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">طلب {request.id.slice(0, 8)}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  صانع المحتوى: {request.creatorId ? creatorNames.get(request.creatorId) ?? "صانع محتوى" : "بانتظار التوجيه"}
                  {" · "}{request.createdAt.toLocaleDateString("ar")}
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {statusLabels[request.status] ?? request.status}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.brief}</p>
            {request.delivery && (
              <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-semibold">ملف التسليم: {request.delivery.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  اعتمدته المنصة · {new Date(request.delivery.submittedAt).toLocaleDateString("ar")}
                </p>
                <a href={request.delivery.webViewLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand-700 underline">
                  مشاهدة الملف
                </a>
              </div>
            )}
            {request.status === "DELIVERED" && (
              <div className="mt-5 border-t pt-4">
                <h3 className="font-semibold">قيّمي العمل</h3>
                <div className="mt-3 flex gap-1" role="group" aria-label="التقييم من نجمة إلى خمس نجوم">
                  {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    const selected = (ratings[request.id] ?? 0) >= value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} من 5 نجوم`}
                        aria-pressed={ratings[request.id] === value}
                        onClick={() => setRatings((current) => ({ ...current, [request.id]: value }))}
                        className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        <Star size={25} className={selected ? "text-amber-400" : "text-gray-300"} fill={selected ? "currentColor" : "none"} />
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  rows={3}
                  maxLength={1000}
                  aria-label="تعليق اختياري على العمل"
                  placeholder="تعليقك (اختياري)"
                  className="mt-3"
                  value={comments[request.id] ?? ""}
                  onChange={(event) => setComments((current) => ({ ...current, [request.id]: event.target.value }))}
                />
                <Button
                  className="mt-3"
                  disabled={!ratings[request.id] || rate.isPending}
                  onClick={() => rate.mutate({
                    requestId: request.id,
                    value: ratings[request.id],
                    comment: comments[request.id] ?? "",
                  })}
                >
                  {rate.isPending ? "جارٍ حفظ التقييم…" : "إرسال التقييم"}
                </Button>
              </div>
            )}
            {request.review && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <Star size={16} fill="currentColor" /> تقييمك: {request.review.rating}/5
                {request.review.comment && <span className="font-normal text-muted-foreground">· {request.review.comment}</span>}
              </p>
            )}
          </article>
        )) : (
          <EmptyState title="لا توجد طلبات حتى الآن" hint="ستظهر طلبات حملاتك هنا بعد إرسالها إلى المنصة." />
        )}
      </section>
    </main>
  );
}
