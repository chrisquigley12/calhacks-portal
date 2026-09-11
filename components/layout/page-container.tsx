import * as React from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /** "narrow" suits forms and reading; "default" suits tables and dashboards. */
  width?: "default" | "narrow";
  className?: string;
}

/**
 * Horizontal page bounds. Every page uses this so content lines up with the
 * header from screen to screen.
 */
export function PageContainer({
  children,
  width = "default",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6",
        width === "narrow" ? "max-w-2xl" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
