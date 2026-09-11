import * as React from "react";

import { cn } from "@/lib/utils";

export interface DescriptionListItem {
  label: string;
  value: React.ReactNode;
}

interface DescriptionListProps {
  items: DescriptionListItem[];
  className?: string;
}

/**
 * Label/value pairs for metadata such as "Submitted" or "Status". Uses the
 * semantic <dl> element so screen readers announce the pairs as a list.
 */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn("divide-y divide-border text-sm", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
        >
          <dt className="font-medium text-muted-foreground">{item.label}</dt>
          <dd className="sm:col-span-2">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
