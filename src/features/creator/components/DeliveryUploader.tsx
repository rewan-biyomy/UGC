import { useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequestService } from "@/components/core/services/RequestService";
import { UploadManager } from "@/components/core/storage/UploadManager";

interface DeliveryUploaderProps {
  requestId: string;
  creatorId: string;
  onUploaded: () => void;
}

const MAX_DELIVERY_BYTES = 200 * 1024 * 1024;

export function DeliveryUploader({ requestId, creatorId, onUploaded }: DeliveryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const uploadToPlatform = async (accessToken: string) => {
    if (!file) return;
    try {
      const uploaded = await UploadManager.default().strategy().upload(file, accessToken, (event) => {
        setProgress(Math.round((event.loaded / Math.max(event.total, 1)) * 100));
      });
      await RequestService.getInstance().submitDelivery(requestId, creatorId, {
        driveFileId: uploaded.fileId,
        fileName: file.name,
        webViewLink: uploaded.webViewLink,
        mimeType: file.type || "application/octet-stream",
        submittedAt: new Date().toISOString(),
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
      toast.success("تم إرسال الملف إلى المنصة لمراجعته.");
    } catch (error) {
      console.error("Campaign deliverable upload failed", error);
      toast.error(error instanceof Error ? error.message : "تعذّر رفع ملف التسليم.");
    } finally {
      setProgress(null);
    }
  };

  const requestDriveAccess = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.file",
    onSuccess: ({ access_token }) => void uploadToPlatform(access_token),
    onError: (error) => {
      console.error("Delivery Google Drive authorization failed", error);
      toast.error("تعذّر الحصول على إذن Google Drive لرفع ملف التسليم.");
    },
    onNonOAuthError: (error) => {
      console.error("Delivery Google Drive popup failed", error);
      toast.error("لم تكتمل نافذة إذن Google Drive.");
    },
  });

  const selectFile = (candidate?: File) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/") && !candidate.type.startsWith("video/")) {
      toast.error("اختاري ملف صورة أو فيديو.");
      return;
    }
    if (candidate.size > MAX_DELIVERY_BYTES) {
      toast.error("الحد الأقصى لحجم ملف التسليم ٢٠٠ ميغابايت.");
      return;
    }
    setFile(candidate);
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        aria-label="اختيار ملف التسليم"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">إرسال ملف التسليم للمنصة</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {file ? file.name : "صورة أو فيديو · حتى ٢٠٠ ميغابايت"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
            اختيار ملف
          </Button>
          <Button
            type="button"
            disabled={!file || progress !== null}
            onClick={() => { setProgress(0); requestDriveAccess(); }}
          >
            <UploadCloud size={16} />
            {progress === null ? "إرسال للمنصة" : `جارٍ الرفع ${progress}%`}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">تراجع المنصة الملف قبل إتاحته للعلامة التجارية للتقييم.</p>
    </div>
  );
}
