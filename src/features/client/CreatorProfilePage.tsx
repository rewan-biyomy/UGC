import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  BadgeCheck,
  ArrowLeft,
  Plus,
  Play,
  Star,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/use-auth";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import { CreatorRatingService } from "@/components/core/services/CreatorRatingService";
import { CreatorCategory, CREATOR_CATEGORY_LABELS } from "@/components/core/constants/roles";
import { nicheLabel } from "@/components/core/constants/niches";
import { driveThumbnailUrl } from "@/lib/google";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { RequestPackageDialog } from "./components/RequestPackageDialog";
import { usePackageStore } from "./store/package-store";

type ProfileTab = "portfolio" | "reviews" | "profile";

const profileTabs: { id: ProfileTab; label: string; icon: typeof BriefcaseBusiness }[] = [
  { id: "portfolio", label: "معرض الأعمال", icon: BriefcaseBusiness },
  { id: "reviews", label: "التقييمات", icon: Star },
  { id: "profile", label: "الملف الشخصي", icon: UserRound },
];

function categoryLabel(category: string): string {
  return Object.values(CreatorCategory).includes(category as CreatorCategory)
    ? CREATOR_CATEGORY_LABELS[category as CreatorCategory]
    : category.replaceAll("_", " ");
}

export function CreatorProfilePage() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("portfolio");
  const [packageOpen, setPackageOpen] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const { add } = usePackageStore();
  const portfolio = useQuery({
    queryKey: ["portfolio", "creator-profile", creatorId],
    queryFn: () => PortfolioService.getInstance().listApproved({}),
    enabled: !!user && !!creatorId,
  });
  const creatorItems = portfolio.data?.filter((item) => item.creator.id === creatorId) ?? [];
  const creator = creatorItems[0]?.creator;
  const reviews = useQuery({
    queryKey: ["creator", "reviews", creatorId],
    queryFn: () => Promise.resolve(CreatorRatingService.listFor(creatorId ?? "")),
    enabled: !!creatorId,
  });

  if (portfolio.isLoading) {
    return <div className="min-h-screen animate-pulse bg-background" role="status" aria-label="جارٍ تحميل الملف الشخصي" />;
  }

  if (portfolio.isError) {
    return (
      <main dir="rtl" className="min-h-screen bg-muted/40 px-5 py-20 text-center">
        <p role="alert" className="text-rose-700">تعذّر تحميل الملف الشخصي. حاول مرة أخرى.</p>
        <Button className="mt-5" onClick={() => void portfolio.refetch()}>إعادة المحاولة</Button>
      </main>
    );
  }

  if (!creator) {
    return (
      <main dir="rtl" className="min-h-screen bg-muted/40 px-5 py-20">
        <EmptyState title="الملف الشخصي غير متاح" hint="قد لا يكون لدى هذا المنشئ أعمال منشورة حالياً." />
        <div className="mt-6 text-center"><Button variant="outline" onClick={() => navigate("/client")}>العودة لتصفح المنشئين</Button></div>
      </main>
    );
  }

  const avatar = creator.avatarUrl
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=e8f3fb&color=257fbb&size=240`;

  return (
    <main dir="rtl" className="min-h-screen bg-muted/40 text-foreground">
      <header className="bg-brand-700 text-white shadow-sm">
        <nav className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-5 px-5" aria-label="التنقل الرئيسي">
          <Link to="/client" className="text-2xl font-extrabold text-white">UGC Market</Link>
          <Button className="bg-white/15 text-white hover:bg-white/25" onClick={() => navigate("/client")}>
            <ArrowLeft size={17} /> عودة إلى التصفح
          </Button>
        </nav>
      </header>

      <section className="bg-white">
        <div className="mx-auto flex min-h-[315px] max-w-[1480px] flex-col items-center justify-center px-5 pb-10 pt-12 text-center">
          <div className="relative">
            <img src={avatar} alt={`الصورة الشخصية لـ ${creator.name}`} className="h-36 w-36 rounded-full border border-black/5 object-cover shadow-sm" />
            <span className="absolute bottom-2 left-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#38ad50] text-white" aria-label="حساب موثّق"><BadgeCheck size={16} fill="currentColor" /></span>
          </div>
          <h1 className="mt-3 text-[27px] font-normal">{creator.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#7b838b]">
            <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={14} /> {categoryLabel(creator.category)}</span>
            <span className="inline-flex items-center gap-1.5"><UserRound size={14} /> منشئ محتوى</span>
          </div>
          {creator.bio && <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{creator.bio}</p>}
        </div>

        <div className="border-b bg-white">
          <div className="mx-auto flex max-w-[1480px] items-end justify-between px-5">
            <Button onClick={() => setPackageOpen(true)} className="mb-2 hidden rounded-none sm:inline-flex">
              <Plus size={17} /> أضف إلى الباقة
            </Button>
            <div className="flex w-full justify-end gap-1 sm:w-auto sm:gap-2" role="tablist" aria-label="أقسام الملف الشخصي">
              {profileTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 border-b-[3px] px-3 py-4 text-sm transition sm:px-6 ${tab === id ? "border-brand-600 bg-muted/40 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50"}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-[430px] max-w-[1480px] px-5 py-10">
        {tab === "portfolio" && (
          creatorItems.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {creatorItems.map((item) => (
                <article key={item.id} className="group overflow-hidden">
                  <div className={`relative w-full overflow-hidden bg-black ${item.isVerticalVideo ? "aspect-[9/16]" : "aspect-[4/3]"}`}>
                    {item.isVerticalVideo && playingVideoId === item.id ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${encodeURIComponent(item.driveFileId)}/preview`}
                        title={`فيديو من أعمال ${creator.name}`}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="autoplay"
                        allowFullScreen
                      />
                    ) : item.isVerticalVideo ? (
                      <button type="button" className="group/play relative h-full w-full" onClick={() => setPlayingVideoId(item.id)} aria-label={`تشغيل فيديو من أعمال ${creator.name}`}>
                        <img src={item.thumbnailUrl ?? driveThumbnailUrl(item.driveFileId)} alt={`معاينة فيديو من أعمال ${creator.name}`} loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-black/15 text-white transition group-hover/play:bg-black/30" aria-hidden="true"><Play size={42} fill="currentColor" /></span>
                      </button>
                    ) : (
                      <img src={item.thumbnailUrl ?? driveThumbnailUrl(item.driveFileId)} alt={`عمل من معرض ${creator.name}`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 py-3">
                    <span className="truncate text-sm">{nicheLabel(item.nicheId)}</span>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => add(item)}>
                      <Plus size={15} /> أضف للباقة
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="لا توجد أعمال في هذا المعرض بعد" hint="الأعمال التي تحفظها تظهر هنا على هذا الجهاز." />
        )}

        {tab === "reviews" && (
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
            <Star className="mx-auto text-amber-400" size={28} fill="currentColor" />
            <h2 className="mt-3 text-xl font-semibold">تقييمات {creator.name}</h2>
            <p className="mt-4 text-lg font-semibold text-brand-700">{creator.rating.toFixed(1)} / 5</p>
            {reviews.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">جارٍ تحميل المراجعات…</p>
            ) : reviews.data?.length ? (
              <div className="mt-6 space-y-3 text-right">
                {reviews.data.map((review) => (
                  <article key={review.requestId} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{review.clientName}</p>
                      <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star size={15} fill="currentColor" /> {review.rating}/5
                      </p>
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("ar")}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#7b838b]">لا توجد مراجعات منشورة حالياً.</p>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-7 shadow-sm sm:p-9">
            <h2 className="text-xl font-semibold">الملف الشخصي</h2>
            <dl className="mt-6 divide-y divide-gray-100">
              <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-[#7b838b]">الاسم</dt><dd className="font-medium">{creator.name}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-[#7b838b]">نبذة</dt><dd className="max-w-xl text-left font-medium">{creator.bio || "لم يضف نبذة بعد."}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-[#7b838b]">التخصص</dt><dd className="font-medium">{categoryLabel(creator.category)}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-[#7b838b]">الأعمال المعتمدة</dt><dd className="font-medium">{creatorItems.length}</dd></div>
              <div className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-[#7b838b]">التقييم</dt><dd className="inline-flex items-center gap-1 font-medium"><Star size={15} className="text-amber-400" fill="currentColor" />{creator.rating.toFixed(1)}</dd></div>
            </dl>
          </div>
        )}
      </section>

      <RequestPackageDialog open={packageOpen} onOpenChange={setPackageOpen} />
    </main>
  );
}
