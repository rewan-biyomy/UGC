import { useRef, type RefObject } from "react";
import { toast } from "sonner";
import { CreatorCategory, CREATOR_CATEGORY_LABELS } from "@/components/core/constants/roles";
import { NICHES } from "@/components/core/constants/niches";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingValues } from "../schemas/onboarding.schema";

export interface OnboardingFields {
  age: number;
  country: string;
  avatarUrl: string | null;
  brandLogoUrl: string | null;
  category: CreatorCategory;
  nicheIds: string[];
  bio: string;
  brandName: string;
  industry: string;
}

interface CreatorDetailsStepProps {
  role: OnboardingValues["role"];
  fields: OnboardingFields;
  onChange: (fields: OnboardingFields) => void;
}

export function CreatorDetailsStep({ role, fields, onChange }: CreatorDetailsStepProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<OnboardingFields>) => onChange({ ...fields, ...patch });
  const imageUrl = role === "CLIENT" ? fields.brandLogoUrl : fields.avatarUrl;
  const updateImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح.");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("الحد الأقصى لحجم الصورة ١ ميغابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      update(role === "CLIENT" ? { brandLogoUrl: reader.result } : { avatarUrl: reader.result });
    };
    reader.onerror = () => toast.error("تعذّرت قراءة الصورة المختارة.");
    reader.readAsDataURL(file);
  };
  if (role === "CLIENT") {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="onboarding-age">العمر</Label><Input id="onboarding-age" type="number" min={13} max={120} value={fields.age} onChange={(event) => update({ age: Number(event.target.value) })} /></div>
          <div><Label htmlFor="onboarding-country">الدولة</Label><Input id="onboarding-country" autoComplete="country-name" value={fields.country} onChange={(event) => update({ country: event.target.value })} /></div>
        </div>
        <div><Label htmlFor="brandName">اسم العلامة التجارية</Label><Input id="brandName" autoComplete="organization" value={fields.brandName} onChange={(event) => update({ brandName: event.target.value })} className="mt-2" /></div>
        <div><Label htmlFor="industry">مجال العمل</Label><Input id="industry" value={fields.industry} onChange={(event) => update({ industry: event.target.value })} className="mt-2" /></div>
        <ImageField inputRef={imageInputRef} imageUrl={imageUrl} label="شعار العلامة التجارية" onSelect={updateImage} onRemove={() => update({ brandLogoUrl: null })} />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="onboarding-age">العمر</Label><Input id="onboarding-age" type="number" min={13} max={120} value={fields.age} onChange={(event) => update({ age: Number(event.target.value) })} /></div>
        <div><Label htmlFor="onboarding-country">الدولة</Label><Input id="onboarding-country" autoComplete="country-name" value={fields.country} onChange={(event) => update({ country: event.target.value })} /></div>
      </div>
      <ImageField inputRef={imageInputRef} imageUrl={imageUrl} label="الصورة الشخصية" onSelect={updateImage} onRemove={() => update({ avatarUrl: null })} />
      <div><Label htmlFor="category">تخصص صانع المحتوى</Label><Select id="category" value={fields.category} onChange={(event) => update({ category: event.target.value as CreatorCategory })} className="mt-2">
        {Object.entries(CREATOR_CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </Select></div>
      <fieldset>
        <legend className="text-sm font-medium">مجالات المحتوى</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NICHES.map((niche) => <label key={niche.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
            <Checkbox checked={fields.nicheIds.includes(niche.id)} onChange={(event) => update({
              nicheIds: event.target.checked
                ? [...fields.nicheIds, niche.id]
                : fields.nicheIds.filter((id) => id !== niche.id),
            })} />
            {niche.label}
          </label>)}
        </div>
      </fieldset>
      <div><Label htmlFor="bio">نبذة عنك</Label><Textarea id="bio" rows={4} maxLength={500} value={fields.bio} onChange={(event) => update({ bio: event.target.value })} className="mt-2" placeholder="عرّف العلامات التجارية بأسلوبك وخبرتك (من ٢٠ إلى ٥٠٠ حرف)" /><p className="mt-1 text-left text-xs text-muted-foreground">{fields.bio.length}/500</p></div>
    </div>
  );
}

function ImageField({
  inputRef,
  imageUrl,
  label,
  onSelect,
  onRemove,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  imageUrl: string | null;
  label: string;
  onSelect: (file?: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label={label} onChange={(event) => onSelect(event.target.files?.[0])} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {imageUrl && <img src={imageUrl} alt={`معاينة ${label}`} className="h-16 w-16 rounded-lg border object-cover" />}
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>{imageUrl ? "استبدال الصورة" : "اختيار صورة"}</Button>
        {imageUrl && <Button type="button" variant="ghost" onClick={onRemove}>إزالة</Button>}
        <span className="text-xs text-muted-foreground">صورة حتى ١ ميغابايت</span>
      </div>
    </div>
  );
}