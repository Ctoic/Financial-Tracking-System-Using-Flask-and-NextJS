import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/40 dark:text-blue-300",
        secondary:
          "bg-gray-100 text-gray-800 border-transparent dark:bg-gray-800 dark:text-gray-200",
        outline: "text-gray-700 border-gray-300 dark:text-gray-300 dark:border-gray-700",
        success: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-900/40 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/40 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}


