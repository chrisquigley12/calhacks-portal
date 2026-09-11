"use client";

import { startTransition, useActionState, useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AnswerValues,
  FieldDefinition,
  FormDefinition,
} from "@/lib/applications/forms";
import {
  INITIAL_SAVE_STATE,
  type SaveApplicationState,
} from "@/lib/applications/save-state";

type SaveAction = (
  previousState: SaveApplicationState,
  formData: FormData,
) => Promise<SaveApplicationState>;

interface ApplicationFormProps {
  form: FormDefinition;
  initialAnswers: AnswerValues;
  action: SaveAction;
}

/**
 * Renders whichever form definition the server chose for this applicant.
 * Inputs are controlled so values survive a round-trip that returns
 * validation errors. The `intent` field tells the server action whether
 * this is a draft save or a final submission.
 */
export function ApplicationForm({ form, initialAnswers, action }: ApplicationFormProps) {
  const [answers, setAnswers] = useState<AnswerValues>(initialAnswers);
  const [state, formAction, isPending] = useActionState(action, INITIAL_SAVE_STATE);
  const [pendingIntent, setPendingIntent] = useState<"draft" | "submit" | null>(null);

  function setAnswer(name: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [name]: value }));
  }

  // Submitted from onSubmit rather than the form's `action` prop: React
  // resets form fields after an `action` completes, which would clear what
  // the applicant just saved as a draft. The `intent` of whichever button
  // was clicked is still included by the browser in the FormData.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    // Older browsers ignore the submitter argument; the click handler on
    // each button recorded the intent, so fall back to that.
    if (!formData.has("intent") && pendingIntent) {
      formData.set("intent", pendingIntent);
    }
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {form.fields.map((field) => (
        <FormField
          key={field.name}
          id={field.name}
          label={field.label}
          hint={field.hint}
          error={state.fieldErrors[field.name]}
        >
          {(controlProps) => (
            <FieldControl
              field={field}
              value={answers[field.name] ?? (field.kind === "checkboxes" ? [] : "")}
              onChange={(value) => setAnswer(field.name, value)}
              controlProps={controlProps}
            />
          )}
        </FormField>
      ))}

      {state.status === "error" && <FormError message={state.message} />}
      {state.status === "saved" && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          You can save a draft and come back. Once submitted, the application
          can&apos;t be edited.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="outline"
            disabled={isPending}
            onClick={() => setPendingIntent("draft")}
          >
            {isPending && pendingIntent === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="submit"
            disabled={isPending}
            onClick={() => setPendingIntent("submit")}
          >
            {isPending && pendingIntent === "submit" ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface FieldControlProps {
  field: FieldDefinition;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  controlProps: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean };
}

function FieldControl({ field, value, onChange, controlProps }: FieldControlProps) {
  switch (field.kind) {
    case "text":
    case "url":
      return (
        <Input
          {...controlProps}
          name={field.name}
          type={field.kind === "url" ? "url" : "text"}
          value={typeof value === "string" ? value : ""}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "textarea":
      return (
        <Textarea
          {...controlProps}
          name={field.name}
          value={typeof value === "string" ? value : ""}
          maxLength={field.maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "select":
      return (
        <Select
          {...controlProps}
          name={field.name}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    case "checkboxes": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div
          id={controlProps.id}
          role="group"
          aria-labelledby={`${controlProps.id}-label`}
          aria-describedby={controlProps["aria-describedby"]}
          className="grid gap-2 sm:grid-cols-2"
        >
          {field.options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={field.name}
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  )
                }
                className="size-4 rounded border-input accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }
  }
}
