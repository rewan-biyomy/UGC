import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)}
      {...props}
    />
  );
}
