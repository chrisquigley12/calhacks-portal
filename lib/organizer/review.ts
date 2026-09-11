import {
  REVIEW_STATUSES,
  type ApplicationStatus,
  type ReviewStatus,
} from "@/lib/applications/types";

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

export interface ReviewInput {
  status: ReviewStatus;
  score: number | null;
  notes: string;
}

export interface ReviewValidation {
  input: ReviewInput | null;
  errors: Record<string, string>;
}

/**
 * Turns the review form's FormData into a validated ReviewInput. The
 * database function re-checks the same rules, so this exists to give the
 * organizer a precise error message rather than a raised exception.
 */
export function parseReviewInput(formData: FormData): ReviewValidation {
  const errors: Record<string, string> = {};

  const rawStatus = formData.get("status");
  const status = REVIEW_STATUSES.find((candidate) => candidate === rawStatus) ?? null;
  if (!status) {
    errors.status = "Choose a review outcome: reviewed, accepted, or rejected.";
  }

  const rawScore = formData.get("score");
  const scoreText = typeof rawScore === "string" ? rawScore.trim() : "";
  let score: number | null = null;
  if (scoreText !== "") {
    const parsed = Number(scoreText);
    if (!Number.isInteger(parsed) || parsed < MIN_SCORE || parsed > MAX_SCORE) {
      errors.score = `Score must be a whole number from ${MIN_SCORE} to ${MAX_SCORE}.`;
    } else {
      score = parsed;
    }
  }

  const rawNotes = formData.get("notes");
  const notes = typeof rawNotes === "string" ? rawNotes.trim() : "";
  if (notes.length > 2000) {
    errors.notes = "Please keep notes under 2000 characters.";
  }

  if (Object.keys(errors).length > 0 || !status) {
    return { input: null, errors };
  }

  return { input: { status, score, notes }, errors };
}

/**
 * What the review form should show when an organizer opens an application.
 * A freshly submitted application starts at "reviewed" (the minimum outcome
 * of saving a review); an already-reviewed one shows its recorded outcome.
 */
export function defaultReviewStatus(currentStatus: ApplicationStatus): ReviewStatus {
  const recorded = REVIEW_STATUSES.find((candidate) => candidate === currentStatus);
  return recorded ?? "reviewed";
}
