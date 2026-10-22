import axios from "axios";

const NETWORK_ERROR_MESSAGE =
  "تعذّر الاتصال بخادم المنصة. شغّلي الخادم الخلفي واضبطي VITE_API_URL على عنوانه، ثم أعيدي تشغيل الواجهة.";

function responseMessage(data: unknown): string | null {
  if (typeof data === "string") {
    const message = data.trim();
    return message && !message.startsWith("<") ? message.slice(0, 300) : null;
  }
  if (!data || typeof data !== "object") return null;

  const payload = data as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 300);
    if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === "string" && !!item.trim());
      if (messages.length) return messages.join("، ").slice(0, 300);
    }
  }
  return null;
}

export function requestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") return NETWORK_ERROR_MESSAGE;

    const message = responseMessage(error.response?.data);
    if (message) return message;
    if (error.response?.status === 400) return "رفض الخادم الطلب. تحققي من البيانات وإعدادات التسجيل.";
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "رفض الخادم تسجيل الدخول أو الصلاحية المطلوبة.";
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
