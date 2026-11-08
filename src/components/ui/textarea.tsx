import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] leading-6 text-foreground placeholder:text-ink-subtle hover:border-border-hover focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.15)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
