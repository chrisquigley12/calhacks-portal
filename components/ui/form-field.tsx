import * as React from "react";

import { Label } from "@/components/ui/label";

/**
 * Attributes a form control needs so assistive technology can connect it to
 * its label, hint, and error message.
 */
export interface FormControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface FormFieldProps {
  /** Unique id for the control; also used to derive hint/error ids. */
  id: string;
  label: string;
  /** Optional helper text shown under the control. */
  hint?: string;
  /** When present, the field is marked invalid and the message is announced. */
  error?: string;
  /**
   * Render function for the actual control. It receives the accessibility
   * props that must be spread onto the <input>/<select>/<textarea>. Using a
   * function (rather than cloning children) keeps the wiring explicit.
   */
  children: (controlProps: FormControlProps) => React.ReactNode;
}

/**
 * Wraps a form control with a label, optional hint, and error message, and
 * wires up the ARIA relationships between them.
 */
export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // The error replaces the hint when present, so only reference whichever
  // one is actually rendered.
  const showHint = Boolean(hint) && !error;
  const describedBy = [showHint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const controlProps: FormControlProps = {
    id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children(controlProps)}
      {showHint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
