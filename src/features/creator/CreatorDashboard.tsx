// src/features/creator/CreatorDashboard.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CreatorUser } from "@/core/models/User";
import { PortfolioService } from "@/core/services/PortfolioService";
import { useAuth } from "@/app/providers/use-auth";
import { PortfolioCard } from "@/features/shared/components/PortfolioCard";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { Button } from "@/components/ui/button";
import { MediaUploader } from "./components/MediaUploader";
import { CreatorProfileEditor } from "./components/CreatorProfileEditor";
import { CreatorRequests } from "./components/CreatorRequests";

const creatorPages = [
  { path: "/creator/profile", label: "تعديل الملف الشخصي" },
  { path: "/creator/portfolio", label: "معرض الأعمال" },
  { path: "/creator/upload", label: "رفع المحتوى" },
  { path: "/creator/requests", label: "طلبات المنصة" },
] as const;

export function CreatorDashboard() {
  const { user } = useAuth();
  const creator = user instanceof CreatorUser ? user : null;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activePage] = creatorPages.filter((page) => page.path === pathname);

  const mine = useQuery({
    queryKey: ["portfolio", "mine", creator?.id],
    queryFn: () => PortfolioService.getInstance().listMine(creator?.id ?? ""),
    enabled: !!creator,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => PortfolioService.getInstance().removeMine(creator?.id ?? "", itemId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portfolio", "mine", creator?.id] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio", "approved"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio", "creator-profile"] }),
      ]);
      toast.success("تم حذف العمل من معرضك.");
    },
    onError: (error) => {
      console.error("Portfolio item removal failed", error);
      toast.error("تعذّر حذف العمل من المعرض.");
    },
  });

  if (!creator) {
    return <Navigate to="/auth" replace />;
  }

  if (pathname === "/creator") {
    return <Navigate to="/creator/upload" replace />;
  }

  if (!activePage) {
    return <Navigate to="/creator/upload" replace />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/40">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h1 className="text-xl font-bold">مساحة صانع المحتوى</h1><p className="text-xs text-muted-foreground">مرحباً، {creator.name}</p></div>
          <nav aria-label="أقسام مساحة صانع المحتوى" className="flex flex-wrap gap-2 text-sm font-medium">
            {creatorPages.map((page) => (
              <Link key={page.path} to={page.path}
                aria-current={activePage.path === page.path ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-4 py-2 transition ${activePage.path === page.path ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {page.label}
              </Link>
            ))}
            <Button variant="outline" onClick={() => navigate("/")}>الرئيسية</Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        {activePage.path === "/creator/profile" && <CreatorProfileEditor creator={creator} />}
        {activePage.path === "/creator/upload" && (creator.category ? (
          <MediaUploader creator={creator} creatorCategory={creator.category}
            onUploaded={() => { void queryClient.invalidateQueries({ queryKey: ["portfolio", "mine", creator.id] }); }} />
        ) : (
          <EmptyState title="أكمل ملفك الشخصي" hint="اختر تخصصك أثناء التسجيل قبل رفع أي محتوى." />
        ))}
        {activePage.path === "/creator/requests" && <CreatorRequests creator={creator} />}
        {activePage.path === "/creator/portfolio" && (
          <section aria-labelledby="creator-portfolio-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><h2 id="creator-portfolio-heading" className="text-xl font-semibold">معرض الأعمال</h2><p className="mt-1 text-sm text-muted-foreground">{mine.data?.length ?? 0} أعمال</p></div>
            </div>
            {mine.isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-lg bg-white" />)}</div>
            ) : mine.isError ? (
              <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-700">تعذّر تحميل معرضك.</p>
            ) : mine.data?.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {mine.data.map((item) => <PortfolioCard key={item.id} item={item} actions={
                  <Button size="sm" variant="destructive" className="w-full" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>
                    <Trash2 size={15} /> حذف من المعرض
                  </Button>
                } />)}
              </div>
            ) : <EmptyState title="معرضك جاهز لأول عنصر" hint="ارفع صورة أو فيديو عمودي لإضافته إلى معرض أعمالك." />}
          </section>
        )}
      </main>
    </div>
  );
}