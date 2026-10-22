import { useRef, useState } from "react";
import { Check, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CreatorUser } from "@/components/core/models/User";
import { useAuth } from "@/app/providers/use-auth";

const MAX_AVATAR_BYTES = 1024 * 1024;

export function CreatorProfileEditor({ creator }: { creator: CreatorUser }) {
  const { updateCreatorProfile, isDemoSession } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(creator.avatarUrl);
  const [bio, setBio] = useState(creator.bio ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("الحد الأقصى لحجم الصورة الشخصية ١ ميغابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarUrl(reader.result);
      else toast.error("تعذّر قراءة الصورة المختارة.");
    };
    reader.onerror = () => toast.error("تعذّر قراءة الصورة المختارة.");
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const normalizedBio = bio.trim();
    if (normalizedBio.length < 20 || normalizedBio.length > 500) {
      toast.error("يجب أن تتراوح النبذة بين ٢٠ و٥٠٠ حرف.");
      return;
    }
    setSaving(true);
    try {
      await updateCreatorProfile({ avatarUrl, bio: normalizedBio });
      setEditing(false);
      toast.success("تم حفظ الملف الشخصي.");
    } catch (error) {
      console.error("Creator profile update failed", error);
      toast.error("تعذّر حفظ الملف الشخصي. تحقّق من مساحة التخزين ثم أعد المحاولة.");
    } finally {
      setSaving(false);
    }
  };

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=e8f3fb&color=257fbb&size=240`;
  const cancel = () => {
    setAvatarUrl(creator.avatarUrl);
    setBio(creator.bio ?? "");
    setEditing(false);
  };

  return (
    <section className="mx-auto w-full max-w-5xl rounded-lg border bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">الملف الشخصي</h2>
          {isDemoSession && <p className="mt-1 text-sm text-amber-700">الوضع التجريبي: تحفظ التعديلات على هذا الجهاز فقط.</p>}
        </div>
        {!editing && <Button type="button" size="icon" variant="outline" aria-label="تعديل الملف الشخصي" title="تعديل الملف الشخصي" onClick={() => setEditing(true)}><Pencil size={17} /></Button>}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <img src={avatarUrl ?? fallbackAvatar} alt={`الصورة الشخصية لـ ${creator.name}`} className="h-24 w-24 rounded-full border object-cover" />
        {editing ? <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="اختيار صورة شخصية"
            onChange={(event) => selectAvatar(event.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={16} /> تغيير الصورة
          </Button>
          {avatarUrl && <Button type="button" size="icon" variant="ghost" aria-label="إزالة الصورة الشخصية" title="إزالة الصورة الشخصية" onClick={() => setAvatarUrl(null)}><Trash2 size={16} /></Button>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">صورة JPG أو PNG أو WebP · حتى ١ ميغابايت</p>
        </div> : <div><p className="font-semibold">{creator.name}</p><p className="mt-1 text-sm text-muted-foreground">صانع محتوى</p></div>}
      </div>
      <label htmlFor="creator-bio" className="mt-6 block text-sm font-medium">نبذة عنك</label>
      {editing ? <>
        <Textarea id="creator-bio" rows={5} maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-2" />
        <p className="mt-1 text-left text-xs text-muted-foreground">{bio.length}/500 · من ٢٠ إلى ٥٠٠ حرف</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={cancel}><X size={16} /> إلغاء</Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}><Check size={16} /> {saving ? "جارٍ الحفظ…" : "حفظ"}</Button>
        </div>
      </> : <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{creator.bio || "أضف نبذة تعريفية عنك."}</p>}
    </section>
  );
}
