import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * One button family. States: hover (darker / tinted), active (1px press),
 * focus-visible (coral ring), disabled (45% + not-allowed).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium cursor-pointer select-none border border-transparent transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:focus-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0.4_0.15_20/0.25),inset_0_1px_0_oklch(1_0_0/0.14)] hover:bg-primary-hover",
        secondary: "bg-card text-foreground border-input shadow-card hover:bg-hover hover:border-border-hover",
        outline: "bg-card text-foreground border-input shadow-card hover:bg-hover hover:border-border-hover",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        soft: "bg-primary-soft text-primary-ink hover:brightness-95",
        destructive: "bg-card text-neg-fg border-neg-bd hover:bg-neg-bg",
        link: "text-primary-ink underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        default: "h-9 px-3.5 text-[13px] rounded-lg [&_svg]:size-4",
        sm: "h-[30px] px-2.5 text-[12.5px] rounded-md [&_svg]:size-3.5",
        lg: "h-11 px-5 text-[14.5px] rounded-xl [&_svg]:size-4",
        icon: "size-9 rounded-lg [&_svg]:size-4",
        "icon-sm": "size-[30px] rounded-md [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
