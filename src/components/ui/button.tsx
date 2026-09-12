import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-wider cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:translate-x-[2px] active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground border-2 border-black shadow-comic-accent hover:bg-accent/90",
        accent:
          "bg-accent text-accent-foreground border-2 border-black shadow-comic-accent hover:bg-accent/90",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive shadow-comic hover:bg-destructive/90",
        outline:
          "border-2 border-rule bg-background text-foreground shadow-comic hover:bg-accent hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-rule shadow-comic hover:bg-secondary/80",
        warn: "bg-warn text-background border-2 border-black shadow-comic hover:bg-warn/90 font-black",
        ghost:
          "border-2 border-transparent text-foreground hover:border-rule hover:bg-muted/40 active:translate-x-0 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline border-0 shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "min-h-[44px] h-11 px-6 py-2",
        sm: "min-h-[36px] h-9 px-4 text-xs",
        lg: "min-h-[52px] h-13 px-8 text-base",
        icon: "size-11 min-h-[44px] min-w-[44px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
