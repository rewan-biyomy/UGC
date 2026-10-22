import { useEffect, useRef, useState } from "react";
import { useGoogleOAuth, type GsiButtonConfiguration, type IdConfiguration } from "@react-oauth/google";
import { toast } from "sonner";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
}

let initializedClientId: string | null = null;
let activeCredentialHandler: ((credential: string) => void) | null = null;

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (configuration: IdConfiguration) => void;
      renderButton: (container: HTMLElement, configuration: GsiButtonConfiguration) => void;
    };
  };
}

export function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [width] = useState(() => Math.max(200, Math.min(360, window.innerWidth - 96)));

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    activeCredentialHandler = (credential) => onSuccessRef.current(credential);
    return () => {
      activeCredentialHandler = null;
    };
  }, []);

  useEffect(() => {
    const google = (window as Window & { google?: GoogleIdentityApi }).google;
    const container = containerRef.current;
    if (!scriptLoadedSuccessfully || !google || !container) return;

    if (initializedClientId && initializedClientId !== clientId) {
      toast.error("إعداد Google الحالي لا يطابق الجلسة المحملة.");
      return;
    }
    if (!initializedClientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            toast.error("لم يُرجع Google بيانات تسجيل الدخول المطلوبة.");
            return;
          }
          activeCredentialHandler?.(response.credential);
        },
      });
      initializedClientId = clientId;
    }
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width,
    });
    return () => container.replaceChildren();
  }, [clientId, scriptLoadedSuccessfully, width]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">تسجيل الدخول عبر Google غير مفعّل. أضف VITE_GOOGLE_CLIENT_ID إلى إعدادات البيئة لتفعيله.</p>;
  }
  return (
    <div>
      <div ref={containerRef} className="flex min-h-10 justify-center" />
      <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
        إذا ظهرت صفحة Google بخطأ 400، أضيفي عنوان الموقع الحالي ({typeof window === "undefined" ? "عنوان التطبيق" : window.location.origin}) ضمن Authorized JavaScript origins في إعداد OAuth من نوع Web application، ثم أعيدي تشغيل الواجهة.
      </p>
    </div>
  );
}