import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card px-3 text-[14px] text-foreground transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-border-hover focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.15)] aria-[invalid=true]:border-neg-fg aria-[invalid=true]:shadow-[0_0_0_3px_oklch(0.5_0.18_20/0.12)] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-muted disabled:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
