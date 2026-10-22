import { useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/providers/use-auth";
import type { CreatorCategory } from "@/components/core/constants/roles";
import { ClientUser, CreatorUser } from "@/components/core/models/User";
import { FullScreenLoader } from "@/features/shared/components/FullScreenLoader";
import { requestErrorMessage } from "@/lib/request-error";
import { onboardingSchema, registrationSchema, type OnboardingValues, type RegistrationValues } from "../schemas/onboarding.schema";
import { CreatorDetailsStep, type OnboardingFields } from "./CreatorDetailsStep";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { RoleSelectStep } from "./RoleSelectStep";

type Step = "role" | "method" | "email" | "details" | "review";
const emptyFields: OnboardingFields = {
  age: 18,
  country: "",
  avatarUrl: null,
  brandLogoUrl: null,
  category: "PHOTOGRAPHY_MODEL" satisfies CreatorCategory,
  nicheIds: [],
  bio: "",
  brandName: "",
  industry: "",
};
const emptyRegistration: RegistrationValues = {
  role: "CREATOR",
  name: "",
  age: 18,
  country: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, isLoading, isDemoAuthEnabled, signInWithGoogle, registerWithEmail, signInWithDemo, completeOnboarding } = useAuth();
  const isCreator = user instanceof CreatorUser;
  const isClient = user instanceof ClientUser;
  const hasCompletedProfile = isCreator
    ? !!user.category && !!user.bio
    : isClient && !!user.brandName && !!user.industry;
  const [step, setStep] = useState<Step>(user ? "details" : "role");
  const [role, setRole] = useState<OnboardingValues["role"]>(isClient ? "CLIENT" : "CREATOR");
  const [fields, setFields] = useState<OnboardingFields>(() => ({
    ...emptyFields,
    age: user?.age ?? emptyFields.age,
    country: user?.country ?? emptyFields.country,
    avatarUrl: isCreator ? user.avatarUrl : null,
    category: isCreator ? user.category ?? emptyFields.category : emptyFields.category,
    nicheIds: isCreator ? [...user.nicheIds] : emptyFields.nicheIds,
    bio: isCreator ? user.bio ?? emptyFields.bio : emptyFields.bio,
    brandName: isClient ? user.brandName ?? emptyFields.brandName : emptyFields.brandName,
    industry: isClient ? user.industry ?? emptyFields.industry : emptyFields.industry,
    brandLogoUrl: isClient ? user.brandLogoUrl : null,
  }));
  const [registration, setRegistration] = useState(emptyRegistration);
  const [registrationErrors, setRegistrationErrors] = useState<Partial<Record<keyof RegistrationValues, string>>>({});
  const [busy, setBusy] = useState(false);

  if (isLoading) return <FullScreenLoader />;
  if (user && hasCompletedProfile) return <Navigate to={user.dashboardPath()} replace />;

  const selectRole = (nextRole: OnboardingValues["role"]) => {
    setRole(nextRole);
    setRegistration((current) => ({ ...current, role: nextRole }));
    setStep(user ? "details" : "method");
  };

  const handleGoogleSuccess = async (credential: string) => {
    setBusy(true);
    try {
      const authenticatedUser = await signInWithGoogle(credential, role);
      if (authenticatedUser.role !== role) {
        toast.info("هذا الحساب مرتبط بدور آخر. سنفتح مساحته الحالية.");
        navigate(authenticatedUser.dashboardPath(), { replace: true });
        return;
      }
      if (authenticatedUser instanceof CreatorUser) {
        const complete = !!authenticatedUser.category && !!authenticatedUser.bio;
        if (complete) {
          navigate(authenticatedUser.dashboardPath(), { replace: true });
          return;
        }
        setFields((current) => ({
          ...current,
          age: authenticatedUser.age ?? current.age,
          country: authenticatedUser.country ?? current.country,
          avatarUrl: authenticatedUser.avatarUrl,
          category: authenticatedUser.category ?? current.category,
          nicheIds: [...authenticatedUser.nicheIds],
          bio: authenticatedUser.bio ?? current.bio,
        }));
      } else if (authenticatedUser instanceof ClientUser) {
        if (authenticatedUser.brandName && authenticatedUser.industry) {
          navigate(authenticatedUser.dashboardPath(), { replace: true });
          return;
        }
        setFields((current) => ({
          ...current,
          age: authenticatedUser.age ?? current.age,
          country: authenticatedUser.country ?? current.country,
          brandName: authenticatedUser.brandName ?? current.brandName,
          industry: authenticatedUser.industry ?? current.industry,
          brandLogoUrl: authenticatedUser.brandLogoUrl,
        }));
      }
      setRole(authenticatedUser.role);
      setStep("details");
      toast.success("تم التحقق من حساب Google بنجاح.");
    } catch (error) {
      console.error("Google sign-in failed", error);
      toast.error(requestErrorMessage(error, "تعذّر التحقق من حساب Google. حاول مرة أخرى."));
    } finally {
      setBusy(false);
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = registrationSchema.safeParse({ ...registration, role });
    if (!parsed.success) {
      const errors: Partial<Record<keyof RegistrationValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RegistrationValues;
        errors[key] ??= issue.message;
      }
      setRegistrationErrors(errors);
      return;
    }
    setRegistrationErrors({});
    setBusy(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = parsed.data;
      await registerWithEmail(payload);
      setFields((current) => ({ ...current, age: parsed.data.age, country: parsed.data.country }));
      setStep("details");
      toast.success("تم التحقق من البيانات الأساسية. أكمل إعداد الملف لإتمام التسجيل.");
    } catch (error) {
      console.error("Email registration failed", error);
      toast.error(requestErrorMessage(error, "تعذّر إنشاء الحساب. بياناتك ما زالت محفوظة في النموذج."));
    } finally {
      setBusy(false);
    }
  };

  const handleDemoSignIn = async () => {
    setBusy(true);
    try {
      await signInWithDemo(role);
      setStep("details");
      toast.success("الحساب التجريبي جاهز.");
    } catch (error) {
      console.error("Demo sign-in failed", error);
      toast.error("تعذّر بدء الجلسة التجريبية. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = role === "CREATOR"
      ? { role, age: fields.age, country: fields.country, avatarUrl: fields.avatarUrl, category: fields.category, nicheIds: fields.nicheIds, bio: fields.bio }
      : { role, age: fields.age, country: fields.country, brandLogoUrl: fields.brandLogoUrl, brandName: fields.brandName, industry: fields.industry };
    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "يرجى مراجعة البيانات المدخلة.");
      return;
    }
    setStep("review");
  };

  const finishOnboarding = async () => {
    const payload = role === "CREATOR"
      ? { role, age: fields.age, country: fields.country, avatarUrl: fields.avatarUrl, category: fields.category, nicheIds: fields.nicheIds, bio: fields.bio }
      : { role, age: fields.age, country: fields.country, brandLogoUrl: fields.brandLogoUrl, brandName: fields.brandName, industry: fields.industry };
    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "يرجى مراجعة البيانات المدخلة.");
      setStep("details");
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding(parsed.data);
      toast.success("تم إنشاء حسابك بنجاح.");
      navigate(parsed.data.role === "CLIENT" ? "/client" : "/creator", { replace: true });
    } catch (error) {
      console.error("Onboarding request failed", error);
      toast.error(requestErrorMessage(error, "تعذّر إكمال إعداد الحساب. بياناتك محفوظة في هذه الخطوة."));
    } finally {
      setBusy(false);
    }
  };

  const stepNumber = step === "role" ? 1 : step === "method" ? 2 : step === "email" ? 3 : step === "details" ? 4 : 5;
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-amber-50 px-4 py-10">
      <Card className="w-full max-w-3xl rounded-3xl border-0 p-6 shadow-xl sm:p-10">
        <div className="mb-8 flex items-center gap-2" aria-label={`Step ${stepNumber} of 5`}>
          {["نوع الحساب", "طريقة التسجيل", "البيانات الأساسية", "الملف", "المراجعة"].map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index + 1 < stepNumber ? "bg-emerald-500 text-white" : index + 1 === stepNumber ? "bg-brand-600 text-white" : "bg-muted text-muted-foreground"}`}>
                {index + 1 < stepNumber ? <Check size={16} /> : index + 1}
              </span>
              <span className={`hidden text-sm sm:block ${index + 1 === stepNumber ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
              {index < 4 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
        {step === "role" && <RoleSelectStep onSelect={selectRole} />}
        {step === "method" && (
          <section>
            <h1 className="text-2xl font-bold sm:text-3xl">اختر طريقة التسجيل</h1>
            <p className="mt-2 text-muted-foreground">اخترت الانضمام بصفتك {role === "CLIENT" ? "علامة تجارية" : "صانع محتوى"}.</p>
            {isDemoAuthEnabled && (
              <div className="mt-6 rounded-xl border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">الوضع التجريبي: جرّب المنصة دون ربط Google أو الخادم.</p>
                <Button type="button" className="mt-3" onClick={() => void handleDemoSignIn()} disabled={busy}>
                  المتابعة بحساب تجريبي
                </Button>
              </div>
            )}
            <div className="mt-8"><GoogleLoginButton onSuccess={handleGoogleSuccess} /></div>
            <div className="mt-5 text-center"><Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep("email")}>إنشاء حساب بالبريد الإلكتروني</Button></div>
            {busy && <p className="mt-3 text-center text-sm text-muted-foreground">جارٍ التحقق من الحساب…</p>}
            <Button variant="ghost" className="mt-6" onClick={() => setStep("role")}><ArrowLeft size={16} /> رجوع</Button>
          </section>
        )}
        {step === "email" && (
          <form onSubmit={(event) => void submitRegistration(event)} noValidate>
            <h1 className="text-2xl font-bold sm:text-3xl">البيانات الأساسية</h1>
            <p className="mb-6 mt-2 text-sm text-muted-foreground">لن تُحفظ كلمة المرور في المتصفح.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="registration-name">الاسم الكامل</Label><Input id="registration-name" autoComplete="name" value={registration.name} onChange={(event) => setRegistration({ ...registration, name: event.target.value })} aria-invalid={!!registrationErrors.name} />{registrationErrors.name && <p className="mt-1 text-sm text-destructive">{registrationErrors.name}</p>}</div>
              <div><Label htmlFor="registration-age">العمر</Label><Input id="registration-age" type="number" min={13} max={120} value={registration.age} onChange={(event) => setRegistration({ ...registration, age: Number(event.target.value) })} aria-invalid={!!registrationErrors.age} />{registrationErrors.age && <p className="mt-1 text-sm text-destructive">{registrationErrors.age}</p>}</div>
              <div><Label htmlFor="registration-country">الدولة</Label><Input id="registration-country" autoComplete="country-name" value={registration.country} onChange={(event) => setRegistration({ ...registration, country: event.target.value })} aria-invalid={!!registrationErrors.country} />{registrationErrors.country && <p className="mt-1 text-sm text-destructive">{registrationErrors.country}</p>}</div>
              <div className="sm:col-span-2"><Label htmlFor="registration-email">البريد الإلكتروني</Label><Input id="registration-email" type="email" autoComplete="email" value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} aria-invalid={!!registrationErrors.email} />{registrationErrors.email && <p className="mt-1 text-sm text-destructive">{registrationErrors.email}</p>}</div>
              <div><Label htmlFor="registration-password">كلمة المرور</Label><Input id="registration-password" type="password" autoComplete="new-password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} aria-invalid={!!registrationErrors.password} />{registrationErrors.password && <p className="mt-1 text-sm text-destructive">{registrationErrors.password}</p>}</div>
              <div><Label htmlFor="registration-confirm-password">تأكيد كلمة المرور</Label><Input id="registration-confirm-password" type="password" autoComplete="new-password" value={registration.confirmPassword} onChange={(event) => setRegistration({ ...registration, confirmPassword: event.target.value })} aria-invalid={!!registrationErrors.confirmPassword} />{registrationErrors.confirmPassword && <p className="mt-1 text-sm text-destructive">{registrationErrors.confirmPassword}</p>}</div>
            </div>
            <div className="mt-7 flex flex-col-reverse justify-between gap-2 sm:flex-row"><Button type="button" variant="ghost" onClick={() => setStep("method")}><ArrowLeft size={16} /> رجوع</Button><Button type="submit" disabled={busy}>{busy ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب والمتابعة"}</Button></div>
          </form>
        )}
        {step === "details" && (
          <form onSubmit={(event) => void submit(event)}>
            <h1 className="text-2xl font-bold sm:text-3xl">أكمل بيانات حسابك</h1>
            <p className="mb-7 mt-2 text-muted-foreground">أضف بعض التفاصيل لنجهّز حسابك.</p>
            <CreatorDetailsStep role={role} fields={fields} onChange={setFields} />
            <div className="mt-7 flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(user ? "role" : "method")}><ArrowLeft size={16} /> رجوع</Button>
              <Button type="submit" disabled={busy}>مراجعة البيانات</Button>
            </div>
          </form>
        )}
        {step === "review" && (
          <section>
            <h1 className="text-2xl font-bold">مراجعة بيانات الحساب</h1>
            <p className="mt-2 text-sm text-muted-foreground">تأكد من المعلومات قبل إرسالها وحفظها.</p>
            <dl className="mt-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground">الاسم</dt><dd className="font-medium">{user?.name ?? registration.name}</dd></div>
              <div><dt className="text-sm text-muted-foreground">البريد الإلكتروني</dt><dd className="break-all font-medium">{user?.email ?? registration.email}</dd></div>
              <div><dt className="text-sm text-muted-foreground">العمر</dt><dd className="font-medium">{fields.age}</dd></div>
              <div><dt className="text-sm text-muted-foreground">الدولة</dt><dd className="font-medium">{fields.country}</dd></div>
              {role === "CREATOR" ? <>
                {fields.avatarUrl && <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">الصورة الشخصية</dt><dd className="mt-2"><img src={fields.avatarUrl} alt="معاينة الصورة الشخصية" className="h-20 w-20 rounded-full object-cover" /></dd></div>}
                <div><dt className="text-sm text-muted-foreground">النبذة</dt><dd className="font-medium">{fields.bio}</dd></div>
                <div><dt className="text-sm text-muted-foreground">الأقسام المختارة</dt><dd className="font-medium">{fields.nicheIds.length}</dd></div>
              </> : <>
                {fields.brandLogoUrl && <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">شعار العلامة التجارية</dt><dd className="mt-2"><img src={fields.brandLogoUrl} alt="معاينة شعار العلامة التجارية" className="h-20 w-20 rounded-lg object-cover" /></dd></div>}
                <div><dt className="text-sm text-muted-foreground">العلامة التجارية</dt><dd className="font-medium">{fields.brandName}</dd></div>
                <div><dt className="text-sm text-muted-foreground">مجال العمل</dt><dd className="font-medium">{fields.industry}</dd></div>
              </>}
            </dl>
            <div className="mt-7 flex flex-col-reverse justify-between gap-2 sm:flex-row">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep("details")}><ArrowLeft size={16} /> تعديل البيانات</Button>
              <Button type="button" disabled={busy} onClick={() => void finishOnboarding()}>{busy ? "جارٍ حفظ الحساب…" : "تأكيد وإنشاء الحساب"}</Button>
            </div>
          </section>
        )}
      </Card>
    </main>
  );
}