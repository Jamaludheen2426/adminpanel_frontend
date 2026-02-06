import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--btn-primary-bg))] text-[hsl(var(--btn-primary-text))] hover:bg-[hsl(var(--btn-primary-hover))]",
        destructive:
          "bg-[hsl(var(--btn-destructive-bg))] text-[hsl(var(--btn-destructive-text))] hover:bg-[hsl(var(--btn-destructive-hover))]",
        outline:
          "border border-[hsl(var(--btn-outline-border))] bg-background text-[hsl(var(--btn-outline-text))] hover:bg-[hsl(var(--btn-outline-hover))]",
        secondary:
          "bg-[hsl(var(--btn-secondary-bg))] text-[hsl(var(--btn-secondary-text))] hover:bg-[hsl(var(--btn-secondary-hover))]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
