"use client";

import { startTransition, useActionState, useState } from "react";

import { STATUS_PRESENTATION } from "@/components/applications/application-status-badge";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_STATUSES, type OrganizerApplication } from "@/lib/applications/types";
import { defaultReviewStatus, MAX_SCORE, MIN_SCORE } from "@/lib/organizer/review";
import { INITIAL_REVIEW_STATE, type ReviewFormState } from "@/lib/organizer/review-state";

type ReviewAction = (
  previousState: ReviewFormState,
  formData: FormData,
) => Promise<ReviewFormState>;

interface ReviewFormProps {
  application: OrganizerApplication;
  action: ReviewAction;
}

/**
 * Records an outcome, score, and notes.
 *
 * The form is submitted from onSubmit rather than the form's `action` prop
 * on purpose: React resets a form's fields after an `action` completes,
 * which would visibly wipe what the organizer just saved. Dispatching the
 * action ourselves keeps the controlled inputs exactly as entered.
 */
export function ReviewForm({ application, action }: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_REVIEW_STATE);
  const [status, setStatus] = useState<string>(defaultReviewStatus(application.status));
  const [score, setScore] = useState<string>(
    application.score === null ? "" : String(application.score),
  );
  const [notes, setNotes] = useState<string>(application.reviewer_notes ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField
        id="status"
        label="Outcome"
        hint={
          application.status === "submitted"
            ? "This application hasn't been reviewed yet."
            : undefined
        }
        error={state.fieldErrors.status}
      >
        {(controlProps) => (
          <Select
            {...controlProps}
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {REVIEW_STATUSES.map((reviewStatus) => (
              <option key={reviewStatus} value={reviewStatus}>
                {STATUS_PRESENTATION[reviewStatus].label}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField
        id="score"
        label="Score"
        hint={`${MIN_SCORE}–${MAX_SCORE}. Leave blank if you haven't scored it yet.`}
        error={state.fieldErrors.score}
      >
        {(controlProps) => (
          <Input
            {...controlProps}
            name="score"
            type="number"
            inputMode="numeric"
            min={MIN_SCORE}
            max={MAX_SCORE}
            step={1}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="max-w-[8rem]"
          />
        )}
      </FormField>

      <FormField
        id="notes"
        label="Reviewer notes"
        hint="Internal. Applicants never see these."
        error={state.fieldErrors.notes}
      >
        {(controlProps) => (
          <Textarea
            {...controlProps}
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
          />
        )}
      </FormField>

      {state.status === "error" && <FormError message={state.message} />}
      {state.status === "saved" && (
        <p role="status" className="text-sm font-medium text-emerald-700">
          {state.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save review"}
        </Button>
      </div>
    </form>
  );
}
