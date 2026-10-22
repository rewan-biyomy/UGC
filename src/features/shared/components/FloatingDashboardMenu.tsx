import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

export interface DashboardMenuItem {
  label: string;
  to?: string;
  onSelect?: () => void;
}

export function FloatingDashboardMenu({ items }: { items: DashboardMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div dir="rtl" className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 lg:hidden">
      {open && (
        <nav aria-label="قائمة التنقل" className="mb-3 w-60 overflow-hidden rounded-2xl border bg-white p-2 shadow-xl">
          {items.map((item) => {
            const className = "block w-full rounded-xl px-4 py-3 text-right text-sm font-medium text-foreground transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600";
            return item.to ? (
              <Link
                key={item.label}
                to={item.to}
                aria-current={location.pathname === item.to ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={className}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => { item.onSelect?.(); setOpen(false); }}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
      <button
        type="button"
        aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-lg ring-4 ring-white/80 transition hover:scale-105 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        {open ? <X size={24} /> : <Menu size={25} />}
      </button>
    </div>
  );
}
