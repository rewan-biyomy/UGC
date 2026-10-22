import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ARABIC_DIALECTS, type ArabicDialect } from "@/components/core/constants/arabic-dialects";
import { useAuth } from "@/app/providers/use-auth";
import { RequestService } from "@/components/core/services/RequestService";
import { driveThumbnailUrl } from "@/lib/google";
import { usePackageStore } from "../store/package-store";

export function RequestPackageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const { items, remove, clear } = usePackageStore();
  const [brief, setBrief] = useState("");
  const [dialects, setDialects] = useState<ArabicDialect[]>([]);
  const submit = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in is required to submit a request");
      if (!brief.trim()) throw new Error("Add a short campaign brief before submitting");
      return RequestService.getInstance().submit({
        clientId: user.id,
        itemIds: items.map((item) => item.id),
        brief: brief.trim(),
        dialects,
      });
    },
    onSuccess: (requests) => {
      toast.success(`تم إرسال ${requests.length} طلب إلى المنصة لمراجعته وتوجيهه إلى المبدعين.`);
      clear();
      setBrief("");
      setDialects([]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Campaign request submission failed", error);
      toast.error(error instanceof Error ? error.message : "Could not submit the request.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب باقة مبدعين</DialogTitle>
          <DialogDescription><span className="inline-flex items-center gap-1"><ShieldCheck size={15} className="text-emerald-600" /> تتولى المنصة مراجعة الطلب والتواصل مع المبدعين، ولا يوجد تواصل مباشر بين العميل والمبدع.</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border p-2.5">
            <img src={item.thumbnailUrl ?? driveThumbnailUrl(item.driveFileId)} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.creator.name}</p><p className="text-xs text-muted-foreground">{item.type.replaceAll("_", " ")}</p></div>
            <Button size="icon" variant="ghost" aria-label={`إزالة ${item.creator.name}`} onClick={() => remove(item.id)}><X size={16} /></Button>
          </div>)}
          {items.length === 0 && <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">أضف عناصر معتمدة إلى باقتك أولاً.</p>}
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">اللهجات المطلوبة (اختياري)</legend>
          <p className="mt-1 text-xs text-muted-foreground">اختر لهجة أو أكثر، أو اتركها بدون اختيار.</p>
          <div className="mt-3 grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border p-3 sm:grid-cols-3">
            {ARABIC_DIALECTS.map((dialect) => (
              <label key={dialect.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={dialects.includes(dialect.id)}
                  onChange={(event) => setDialects((current) => event.target.checked
                    ? [...current, dialect.id]
                    : current.filter((item) => item !== dialect.id))}
                />
                {dialect.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Textarea rows={4} aria-label="وصف الحملة" placeholder="صف حملتك، المخرجات، الجدول الزمني، واحتياجات الاستخدام…" value={brief} onChange={(event) => setBrief(event.target.value)} className="mt-4" />
        <Button className="mt-4 w-full" disabled={!items.length || !brief.trim() || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? "جارٍ الإرسال…" : `إرسال ${items.length} عنصر إلى الإدارة`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}