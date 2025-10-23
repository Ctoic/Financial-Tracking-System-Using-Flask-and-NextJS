import * as React from "react";
import { cn } from "./utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium text-gray-900 dark:text-gray-100",
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";
