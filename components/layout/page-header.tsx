import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small label above the title, e.g. "Organizer" or "Applications". */
  eyebrow?: string;
  /** Buttons or links aligned to the right of the title. */
  actions?: React.ReactNode;
}

/**
 * The title block at the top of an app page. Keeping this in one component
 * gives every page the same typographic hierarchy.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
