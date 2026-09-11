interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

/**
 * Heading block for a section within a page (an <h2>), used by the landing
 * page and later by dashboard sections.
 */
export function SectionHeader({ title, description, eyebrow }: SectionHeaderProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
