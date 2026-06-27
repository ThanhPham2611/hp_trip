import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "teal" | "blue" | "coral" | "sunflower" | "neutral";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  const tones = {
    teal: "bg-teal-container text-teal-fixed",
    blue: "bg-harbor/10 text-harbor",
    coral: "bg-coral/10 text-coral",
    sunflower: "bg-sunflower/20 text-amber-800",
    neutral: "bg-slate-100 text-mist"
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
