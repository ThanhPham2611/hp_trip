import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-mist focus:border-teal focus:ring-2 focus:ring-teal/15",
        className
      )}
      {...props}
    />
  );
});
