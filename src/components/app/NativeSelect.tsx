import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native <select> with our own chevron, so the arrow has proper spacing in every browser. */
export function NativeSelect({ className, size = "md", ...props }: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        {...props}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-lg border border-input bg-card text-foreground hover:border-border-hover focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.15)]",
          size === "sm" ? "h-8 pl-2.5 pr-8 text-[13px]" : "h-10 pl-3 pr-9 text-[14px]",
        )}
      />
      <ChevronDown aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-subtle", size === "sm" ? "right-2.5 size-3.5" : "right-3 size-4")} />
    </span>
  );
}
