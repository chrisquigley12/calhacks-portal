import type { ApplicationType } from "@/lib/application-types";

/**
 * Full lifecycle. Applicants move draft → submitted; organizers move a
 * submitted application to reviewed, accepted, or rejected.
 */
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "reviewed"
  | "accepted"
  | "rejected";

/**
 * The outcomes an organizer can record. "submitted" means "awaiting review"
 * and is never chosen by an organizer; "draft" is never touched at all.
 */
export type ReviewStatus = "reviewed" | "accepted" | "rejected";

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  "reviewed",
  "accepted",
  "rejected",
];

/** Answers to the Hacker application. Every field is a trimmed string. */
export interface HackerAnswers {
  school: string;
  fieldOfStudy: string;
  graduationYear: string;
  experienceLevel: string;
  githubUrl: string;
  whyAttend: string;
  whatToBuild: string;
}

/** Answers to the Volunteer application. `areas` is a multi-select. */
export interface VolunteerAnswers {
  school: string;
  graduationYear: string;
  priorExperience: string;
  whyVolunteer: string;
  availability: string;
  areas: string[];
}

export type ApplicationAnswers = HackerAnswers | VolunteerAnswers;

/** A row in public.applications. */
export interface Application {
  id: string;
  user_id: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  /**
   * Raw JSONB from the database. Narrow it with parseStoredAnswers() before
   * treating it as HackerAnswers/VolunteerAnswers — the column can hold
   * anything, including a partial draft.
   */
  responses: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

/**
 * A row of the organizer_applications view: the application plus the
 * organizer-only review columns and the applicant's name. Applicants never
 * receive this shape.
 */
export interface OrganizerApplication {
  id: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  responses: Record<string, unknown>;
  submitted_at: string | null;
  score: number | null;
  reviewer_notes: string | null;
  applicant_name: string;
}
