import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)}
      {...props}
    />
  );
}
