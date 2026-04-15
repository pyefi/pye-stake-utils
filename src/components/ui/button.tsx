import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-normal transition-all disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-purple)]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary-purple border-t border-brand-purple-8 text-white shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-10)] hover:bg-[#CAADFF] disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:text-text-secondary disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        destructive:
          "bg-brand-action-red border-t border-[#ef4444] text-white shadow-[inset_0px_-1px_0px_0px_rgba(127,29,29,0.5)] hover:brightness-110 disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:text-text-secondary disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        outline:
          "bg-layers-surface-raised-1 border-t border-layers-elevation-highlight text-text-secondary shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)] hover:text-text-primary hover:bg-layers-elevation-highlight disabled:bg-layers-surface-lowered-1 disabled:border-layers-elevation-shadow disabled:opacity-50 disabled:shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]",
        ghost: "text-text-secondary hover:text-text-primary disabled:opacity-50",
      },
      size: {
        default: "h-9 px-4 py-1.5",
        sm: "h-8 gap-1.5 px-3 py-1",
        lg: "h-10 px-6 py-2",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
