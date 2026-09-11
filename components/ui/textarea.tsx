import * as React from "react";

import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        formControlClassName,
        "min-h-[120px] resize-y py-2 leading-relaxed",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
