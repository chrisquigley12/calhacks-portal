import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared styles for text-like form controls (Input, Textarea, Select) so all
 * fields look and focus the same way. `aria-invalid` drives the error styling,
 * which keeps validation state accessible rather than purely visual.
 */
export const formControlClassName =
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(formControlClassName, "h-10", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
