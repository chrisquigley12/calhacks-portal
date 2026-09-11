/**
 * The kinds of applications a participant can submit.
 *
 * This is the single source of truth for applicant types: the landing page
 * renders one card per entry, and later phases reuse the same values for the
 * account-type selector, the database `application_type` column, and
 * organizer filters. Keeping it in one place means adding a new type (say,
 * "mentor") is a one-file change plus a form definition.
 *
 * "organizer" is intentionally not listed here: it is an internal role that
 * reviews applications rather than an application someone submits.
 */
export type ApplicationType = "hacker" | "volunteer";

export interface ApplicationTypeDefinition {
  value: ApplicationType;
  label: string;
  /** One-sentence summary shown on the landing page and type selector. */
  summary: string;
  /** What the application will ask about, so applicants know what to expect. */
  highlights: string[];
}

export const APPLICATION_TYPES: ApplicationTypeDefinition[] = [
  {
    value: "hacker",
    label: "Hacker",
    summary:
      "Spend the weekend building a project with a team. Open to students of every experience level.",
    highlights: [
      "School, graduation year, and what you study",
      "Past projects or things you're proud of",
      "What you hope to build or learn",
    ],
  },
  {
    value: "volunteer",
    label: "Volunteer",
    summary:
      "Help run the event: check-in, logistics, workshops, and keeping hackers fed and on track.",
    highlights: [
      "Your availability across the weekend",
      "Areas you'd like to help with",
      "Relevant event or leadership experience",
    ],
  },
];

export function getApplicationTypeLabel(type: ApplicationType): string {
  const definition = APPLICATION_TYPES.find((entry) => entry.value === type);
  return definition ? definition.label : type;
}
