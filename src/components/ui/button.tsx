import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-[14px] text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "border border-destructive/30 bg-destructive/8 text-destructive font-extrabold hover:-translate-y-px",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border border-brand/18 bg-brand/6 text-foreground hover:-translate-y-px hover:shadow-md hover:bg-brand/10",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "border border-brand-accent/70 bg-gradient-to-br from-brand-accent to-[hsl(48,100%,82%)] text-foreground font-extrabold hover:-translate-y-px hover:shadow-lg",
        warm: "border border-brand-accent/45 bg-brand-accent/14 text-foreground hover:-translate-y-px hover:shadow-md hover:bg-brand-accent/18",
        success: "border border-success/30 bg-success/8 text-success font-extrabold hover:-translate-y-px",
      },
      size: {
        default: "h-10 px-3.5 py-2.5",
        sm: "h-9 rounded-[12px] px-3",
        lg: "h-11 rounded-[14px] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
