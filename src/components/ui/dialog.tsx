import { useEffect, type HTMLAttributes, type PropsWithChildren } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps extends PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      className={`relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function DialogHeader({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <header className="mb-5 space-y-1" {...props}>{children}</header>;
}

export function DialogTitle({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className="text-xl font-bold" {...props}>{children}</h2>;
}

export function DialogDescription({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="text-sm text-muted-foreground" {...props}>{children}</p>;
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Close dialog"
      className="absolute right-3 top-3"
      onClick={onClick}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
