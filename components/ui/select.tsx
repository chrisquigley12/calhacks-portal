import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/input";

/**
 * A styled native <select>. We deliberately use the browser's own select
 * instead of a custom dropdown: it is keyboard- and screen-reader-accessible
 * out of the box, works on mobile, and needs no extra dependency. Pass
 * <option> elements as children.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            formControlClassName,
            "h-10 appearance-none pr-9",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
