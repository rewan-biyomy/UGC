import type {
  SelectHTMLAttributes,
  OptionHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn("h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectItem({ className, ...props }: OptionHTMLAttributes<HTMLOptionElement>) {
  return <option className={className} {...props} />;
}
