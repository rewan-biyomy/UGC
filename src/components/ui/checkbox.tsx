import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, type = "checkbox", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn("h-4 w-4 accent-brand-600", className)}
      {...props}
    />
  );
}
