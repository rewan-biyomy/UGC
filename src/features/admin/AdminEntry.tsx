import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/use-auth";
import { Role } from "@/components/core/constants/roles";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/features/shared/components/FullScreenLoader";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import { AdminDashboard } from "./AdminDashboard";
import { requestErrorMessage } from "@/lib/request-error";

export function AdminEntry() {
  const { user, isLoading, isDemoAuthEnabled, signInWithAdminGoogle, signInWithDemo, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  if (isLoading) return <FullScreenLoader />;
  if (user?.role === Role.ADMIN) return <AdminDashboard />;
  if (user) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-muted/40 p-4">
        <section className="w-full max-w-md rounded-xl border bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-xl font-bold">لا تملك صلاحية الدخول</h1>
          <p className="mt-2 text-sm text-muted-foreground">يتطلب الوصول إلى الإدارة حسابًا إداريًا معتمدًا.</p>
          <p className="mt-2 text-sm text-muted-foreground">سجّل الخروج ثم استخدم حساب Google الذي فوّضه مسؤول الخادم كحساب إداري.</p>
          <Button className="mt-6" variant="outline" onClick={signOut}>تسجيل الخروج</Button>
        </section>
      </main>
    );
  }

  const handleGoogleSuccess = async (credential: string) => {
    setBusy(true);
    try {
      await signInWithAdminGoogle(credential);
    } catch (error) {
      console.error("Admin sign-in failed", error);
      toast.error(requestErrorMessage(error, "تعذّر التحقق من الحساب الإداري. تأكدي من اعتماد الحساب لدى مسؤول الخادم."));
    } finally {
      setBusy(false);
    }
  };

  const handleDemoSignIn = async () => {
    setBusy(true);
    try {
      await signInWithDemo(Role.ADMIN);
    } catch (error) {
      console.error("Demo admin sign-in failed", error);
      toast.error("تعذّر بدء حساب الإدارة التجريبي.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold text-brand-600">UGC Marketplace</p>
        <h1 className="mt-2 text-2xl font-bold">دخول الإدارة</h1>
        <p className="mt-2 text-sm text-muted-foreground">سجّل بحساب إداري موجود ومعتمد مسبقًا.</p>
        <div className="mt-7"><GoogleLoginButton onSuccess={(credential) => void handleGoogleSuccess(credential)} /></div>
        {isDemoAuthEnabled && (
          <div className="mt-6 rounded-xl border border-dashed p-4 text-center">
            <p className="text-sm font-semibold text-amber-900">حساب أدمن تجريبي · بدون كلمة مرور</p>
            <p dir="ltr" className="mt-1 text-sm text-amber-800">admin.demo@creatorlane.local</p>
            <p className="mt-1 text-xs text-amber-800">للتجربة فقط؛ البيانات محلية ولا تمنح صلاحيات على خادم حقيقي.</p>
            <Button className="mt-3" variant="outline" disabled={busy} onClick={() => void handleDemoSignIn()}>
              الدخول بحساب أدمن تجريبي
            </Button>
          </div>
        )}
        {busy && <p role="status" className="mt-4 text-center text-sm text-muted-foreground">جارٍ التحقق من الصلاحيات…</p>}
      </section>
    </main>
  );
}