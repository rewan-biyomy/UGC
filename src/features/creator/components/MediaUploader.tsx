import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { NICHES } from "@/components/core/constants/niches";
import { VIDEO_CATEGORIES, type CreatorCategory } from "@/components/core/constants/roles";
import { PortfolioItem, type MediaType } from "@/components/core/models/PortfolioItem";
import type { CreatorUser } from "@/components/core/models/User";
import { PortfolioService } from "@/components/core/services/PortfolioService";
import { UploadProgress } from "./UploadProgress";

interface MediaUploaderProps {
  creator: CreatorUser;
  creatorCategory: CreatorCategory;
  onUploaded: (item: PortfolioItem) => void;
}

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function getUploadErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء رفع الملف.";
}

function getVideoError(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const ratio = video.videoWidth / video.videoHeight;
      URL.revokeObjectURL(url);
      resolve(video.videoWidth > 0 && video.videoHeight > 0 && Math.abs(ratio - 9 / 16) < 0.02
        ? null
        : "الفيديو ليس بصيغة عمودية ٩:١٦. يرجى اختيار فيديو portrait.");
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("تعذّر قراءة ملف الفيديو.");
    };
    video.src = url;
  });
}

export function MediaUploader({ creator, creatorCategory, onUploaded }: MediaUploaderProps) {
  const acceptsVideo = VIDEO_CATEGORIES.includes(creatorCategory);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nicheId, setNicheId] = useState(NICHES[0]?.id ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const validate = async (candidate: File): Promise<string | null> => {
    if (acceptsVideo) {
      if (!candidate.type.startsWith("video/")) return "يسمح فقط بملفات الفيديو في هذا التخصص.";
      if (candidate.size > MAX_VIDEO_BYTES) return "الحد الأقصى لحجم الفيديو هو ٢٠٠ ميغابايت.";
      return getVideoError(candidate);
    }
    if (!candidate.type.startsWith("image/")) return "يسمح فقط بالصور في هذا التخصص.";
    if (candidate.size > MAX_IMAGE_BYTES) return "الحد الأقصى لحجم الصورة هو ١٥ ميغابايت.";
    return null;
  };

  const handleFile = async (candidate: File) => {
    setError(null);
    const validationError = await validate(candidate);
    if (validationError) {
      setFile(null);
      setPreviewUrl(null);
      setError(validationError);
      return;
    }
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
  };

  const clear = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const uploadWithDriveToken = async (accessToken: string) => {
    if (!file || !nicheId) return;
    try {
      const type: MediaType = acceptsVideo ? "VIDEO_9_16" : "IMAGE";
      const item = await PortfolioService.getInstance().create({
        file,
        nicheId,
        type,
        accessToken,
        creator: {
          id: creator.id,
          name: creator.name,
          avatarUrl: creator.avatarUrl,
          category: creator.category ?? creatorCategory,
          rating: creator.rating,
          nicheIds: [...creator.nicheIds],
        },
        onProgress: setProgress,
      });
      onUploaded(item);
      clear();
      toast.success("تم رفع الملف إلى Google Drive وحفظه في معرضك على هذا الجهاز.");
    } catch (uploadError) {
      console.error("Portfolio upload failed", uploadError);
      toast.error(getUploadErrorMessage(uploadError));
    } finally {
      setProgress(null);
    }
  };

  const requestDriveAccess = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.file",
    onSuccess: ({ access_token }) => void uploadWithDriveToken(access_token),
    onError: (errorResponse) => {
      console.error("Google Drive authorization failed", errorResponse);
      setProgress(null);
      toast.error("تعذّر الحصول على إذن Google Drive. حاول مرة أخرى ووافق على صلاحية الملفات.");
    },
    onNonOAuthError: (error) => {
      console.error("Google Drive authorization popup failed", error);
      setProgress(null);
      toast.error("لم تكتمل نافذة إذن Google Drive.");
    },
  });

  const upload = () => {
    if (!file || !nicheId) return;
    setProgress(0);
    requestDriveAccess();
  };

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <input ref={inputRef} type="file" accept={acceptsVideo ? "video/*" : "image/*"} className="sr-only" onChange={(event) => {
        const selected = event.target.files?.[0];
        if (selected) void handleFile(selected);
      }} />
      {!previewUrl ? (
        <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault();
          const dropped = event.dataTransfer.files[0];
          if (dropped) void handleFile(dropped);
        }} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-14 text-center transition hover:border-brand-400 hover:bg-brand-50">
          <UploadCloud className="h-10 w-10 text-brand-500" />
          <span className="mt-3 font-semibold">اسحب الملف إلى هنا أو اختره من جهازك</span>
          <span className="mt-1 text-sm text-muted-foreground">{acceptsVideo ? "فيديو عمودي ٩:١٦ · حتى ٢٠٠ ميغابايت" : "صورة JPG أو PNG أو WebP · حتى ١٥ ميغابايت"}</span>
        </button>
      ) : (
        <div className="relative mx-auto w-fit">
          {acceptsVideo
            ? <video src={previewUrl} className="max-h-96 rounded-2xl" muted loop autoPlay playsInline controls />
            : <img src={previewUrl} alt="Upload preview" className="max-h-96 rounded-2xl object-contain" />}
          <Button type="button" size="icon" variant="destructive" aria-label="إزالة الملف المحدد" onClick={clear} className="absolute -right-3 -top-3 rounded-full"><X size={16} /></Button>
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive" role="alert">{error}</p>}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-44">
          <Label htmlFor="portfolio-niche">المجال</Label>
          <Select id="portfolio-niche" value={nicheId} onChange={(event) => setNicheId(event.target.value)} className="mt-2">
            {NICHES.map((niche) => <SelectItem key={niche.id} value={niche.id}>{niche.label}</SelectItem>)}
          </Select>
        </div>
        <Button onClick={() => void upload()} disabled={!file || progress !== null}>{progress !== null ? "جارٍ الرفع…" : "رفع إلى Drive"}</Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground" dir="rtl">
        سيطلب Google إذناً للوصول إلى Drive عند الرفع. إذا ظهر خطأ 403، أضف حسابك إلى قائمة مختبري التطبيق في Google Cloud Console.
      </p>
      {progress !== null && <UploadProgress progress={progress} />}
    </section>
  );
}