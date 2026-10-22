import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/providers/use-auth";
import { ClientUser } from "@/components/core/models/User";
import type { CreatorCategory } from "@/components/core/constants/roles";
import { AuthorizationGuard } from "@/components/core/guards/AuthorizationGuard";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import { PortfolioCard } from "@/features/shared/components/PortfolioCard";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { FilterSidebar } from "./components/FilterSidebar";
import { RequestPackageDialog } from "./components/RequestPackageDialog";
import { usePackageStore } from "./store/package-store";
import { FloatingDashboardMenu } from "@/features/shared/components/FloatingDashboardMenu";

export function BrowseCreatorsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { items, add } = usePackageStore();
  const filters = useMemo(() => ({
    q: params.get("q") || undefined,
    niche: params.getAll("niche"),
    category: params.getAll("category") as CreatorCategory[],
    minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
  }), [params]);
  const portfolio = useQuery({
    queryKey: ["portfolio", "approved", filters],
    queryFn: () => PortfolioService.getInstance().listApproved(filters),
    enabled: !!user && AuthorizationGuard.can(user, "request:create"),
  });
  return (
    <main dir="rtl" className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <span className="flex min-w-0 items-center gap-2 text-lg font-bold">
            {user instanceof ClientUser && user.brandLogoUrl && <img src={user.brandLogoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />}
            <span className="truncate">{user instanceof ClientUser && user.brandName ? user.brandName : "تصفح"} <span className="text-brand-600">المبدعين</span></span>
          </span>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span>
            <Button variant="outline" onClick={signOut}>تسجيل الخروج</Button>
            <Button variant="outline" onClick={() => navigate("/client/requests")}><ClipboardList size={16} /> طلباتي</Button>
            <Button className="relative rounded-full" onClick={() => setDialogOpen(true)}><ShoppingBag size={16} /> الباقة {items.length > 0 && <Badge className="bg-white text-brand-700">{items.length}</Badge>}</Button>
          </div>
        </div>
      </header>
      <FloatingDashboardMenu items={[
        { label: "تصفح المبدعين", to: "/client" },
        { label: "طلباتي", to: "/client/requests" },
        { label: `الباقة (${items.length})`, onSelect: () => setDialogOpen(true) },
        { label: "تسجيل الخروج", onSelect: signOut },
      ]} />
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-8 sm:px-6 lg:flex-row">
        <FilterSidebar />
        {portfolio.isLoading ? (
          <div className="grid flex-1 grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-white" />)}</div>
        ) : portfolio.isError ? (
          <p role="alert" className="flex-1 rounded-2xl bg-rose-50 p-6 text-rose-700">تعذّر تحميل أعمال المبدعين. حاول تحديث الصفحة ثم المحاولة مجدداً.</p>
        ) : portfolio.data?.length ? (
          <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {portfolio.data.map((item) => <PortfolioCard key={item.id} item={item} onSelect={() => navigate(`/client/creators/${encodeURIComponent(item.creator.id)}`)} actions={
              <Button size="sm" className="w-full rounded-full" onClick={() => add(item)}>أضف إلى الباقة</Button>
            } />)}
          </div>
        ) : <EmptyState title="لا توجد نتائج مطابقة للفلاتر" hint="جرّب مسح فلتر أو تغيير كلمة البحث." />}
      </div>
      <RequestPackageDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </main>
  );
}