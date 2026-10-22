import { Building2, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { OnboardingValues } from "../schemas/onboarding.schema";

const roles = [
  { role: "CLIENT", icon: Building2, label: "أنا أمثّل علامة تجارية", description: "اكتشف صنّاع المحتوى واطلب باقات لحملاتك" },
  { role: "CREATOR", icon: Camera, label: "أنا صانع محتوى", description: "اعرض أعمالك واستقبل طلبات الحملات" },
] as const;

export function RoleSelectStep({ onSelect }: { onSelect: (role: OnboardingValues["role"]) => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">انضم إلى UGC Marketplace</h1>
      <p className="mt-2 text-muted-foreground">اختر طريقة استخدامك للمنصة.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {roles.map(({ role, icon: Icon, label, description }) => (
          <button key={role} type="button" onClick={() => onSelect(role)} className="text-right">
            <Card className="h-full p-5 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={21} /></span>
              <h2 className="mt-4 font-semibold">{label}</h2>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}