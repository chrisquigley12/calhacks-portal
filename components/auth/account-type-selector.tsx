import { cn } from "@/lib/utils";
import { APPLICATION_TYPES, type ApplicationType } from "@/lib/application-types";

interface AccountTypeSelectorProps {
  value: ApplicationType;
  onChange: (value: ApplicationType) => void;
}

/**
 * Lets a new applicant choose Hacker or Volunteer. Rendered as a native radio
 * group (keyboard and screen-reader friendly) styled as selectable tiles.
 *
 * Only public application types are offered; organizer accounts are created
 * administratively and never through this form.
 */
export function AccountTypeSelector({ value, onChange }: AccountTypeSelectorProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium leading-none">
        I&apos;m applying as
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {APPLICATION_TYPES.map((type) => {
          const isSelected = type.value === value;
          const labelId = `account-type-${type.value}-label`;
          const summaryId = `account-type-${type.value}-summary`;
          return (
            <label
              key={type.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-3 text-left transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name="account-type"
                value={type.value}
                checked={isSelected}
                onChange={() => onChange(type.value)}
                // Name the radio by the title only; the summary becomes its
                // description so screen readers announce "Hacker, radio,
                // <summary>" instead of one long run-on name.
                aria-labelledby={labelId}
                aria-describedby={summaryId}
                className="sr-only"
              />
              <span id={labelId} className="text-sm font-medium">
                {type.label}
              </span>
              <span id={summaryId} className="text-xs leading-relaxed text-muted-foreground">
                {type.summary}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
