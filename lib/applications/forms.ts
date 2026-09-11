import type { AccountType } from "@/lib/account-types";
import type { ApplicationType } from "@/lib/application-types";
import type { HackerAnswers, VolunteerAnswers } from "@/lib/applications/types";

/**
 * Application forms are described as data so the Hacker and Volunteer
 * questions can differ while the renderer, parser, and validator stay
 * shared. Adding a question is a one-line change here.
 */

export interface FieldOption {
  value: string;
  label: string;
}

interface BaseField<Name extends string> {
  name: Name;
  label: string;
  hint?: string;
  required: boolean;
}

interface TextField<Name extends string> extends BaseField<Name> {
  kind: "text" | "textarea" | "url";
  maxLength: number;
}

interface SelectField<Name extends string> extends BaseField<Name> {
  kind: "select";
  options: FieldOption[];
}

interface CheckboxGroupField<Name extends string> extends BaseField<Name> {
  kind: "checkboxes";
  options: FieldOption[];
}

export type FieldDefinition<Name extends string = string> =
  | TextField<Name>
  | SelectField<Name>
  | CheckboxGroupField<Name>;

export interface FormDefinition<Name extends string = string> {
  applicantType: ApplicationType;
  title: string;
  description: string;
  fields: FieldDefinition<Name>[];
}

/** Values as entered in a form: strings, or string arrays for checkboxes. */
export type AnswerValues = Record<string, string | string[]>;

/** Field name → message, for fields that failed validation. */
export type FieldErrors = Record<string, string>;

const GRADUATION_YEARS: FieldOption[] = ["2026", "2027", "2028", "2029", "2030"].map(
  (year) => ({ value: year, label: year }),
);

const HACKER_FORM: FormDefinition<keyof HackerAnswers> = {
  applicantType: "hacker",
  title: "Hacker application",
  description:
    "Tell us a little about yourself and what you're hoping to get out of the weekend.",
  fields: [
    { name: "school", label: "School", kind: "text", required: true, maxLength: 120 },
    {
      name: "fieldOfStudy",
      label: "Major or field of study",
      kind: "text",
      required: true,
      maxLength: 120,
    },
    {
      name: "graduationYear",
      label: "Expected graduation year",
      kind: "select",
      required: true,
      options: GRADUATION_YEARS,
    },
    {
      name: "experienceLevel",
      label: "Hackathon experience",
      kind: "select",
      required: true,
      options: [
        { value: "first", label: "This would be my first hackathon" },
        { value: "some", label: "I've been to one or two" },
        { value: "experienced", label: "I've been to several" },
      ],
    },
    {
      name: "githubUrl",
      label: "GitHub profile",
      kind: "url",
      required: false,
      hint: "Optional. A link to GitHub, GitLab, or a portfolio site.",
      maxLength: 200,
    },
    {
      name: "whyAttend",
      label: "Why do you want to attend Cal Hacks?",
      kind: "textarea",
      required: true,
      maxLength: 1500,
    },
    {
      name: "whatToBuild",
      label: "What would you like to build or learn?",
      kind: "textarea",
      required: true,
      maxLength: 1500,
    },
  ],
};

const VOLUNTEER_FORM: FormDefinition<keyof VolunteerAnswers> = {
  applicantType: "volunteer",
  title: "Volunteer application",
  description:
    "Volunteers keep the event running. Let us know when you're free and how you'd like to help.",
  fields: [
    { name: "school", label: "School", kind: "text", required: true, maxLength: 120 },
    {
      name: "graduationYear",
      label: "Expected graduation year",
      kind: "select",
      required: true,
      options: GRADUATION_YEARS,
    },
    {
      name: "availability",
      label: "Availability",
      kind: "select",
      required: true,
      options: [
        { value: "full-weekend", label: "The full weekend" },
        { value: "saturday", label: "Saturday only" },
        { value: "sunday", label: "Sunday only" },
        { value: "flexible", label: "Flexible — a few shifts" },
      ],
    },
    {
      name: "areas",
      label: "Areas you'd like to help with",
      kind: "checkboxes",
      required: true,
      hint: "Pick as many as you like.",
      options: [
        { value: "check-in", label: "Check-in and registration" },
        { value: "logistics", label: "Logistics and setup" },
        { value: "food", label: "Meals and snacks" },
        { value: "workshops", label: "Workshops and talks" },
        { value: "judging", label: "Judging support" },
      ],
    },
    {
      name: "priorExperience",
      label: "Prior event or volunteer experience",
      kind: "textarea",
      required: false,
      hint: "Optional. Clubs, events, or anything similar you've helped run.",
      maxLength: 1000,
    },
    {
      name: "whyVolunteer",
      label: "Why do you want to volunteer at Cal Hacks?",
      kind: "textarea",
      required: true,
      maxLength: 1500,
    },
  ],
};

/**
 * The form an account type is allowed to fill in. Organizers have no
 * applicant form, so callers must handle null rather than assume one.
 */
export function getFormDefinition(accountType: AccountType): FormDefinition | null {
  switch (accountType) {
    case "hacker":
      return HACKER_FORM;
    case "volunteer":
      return VOLUNTEER_FORM;
    case "organizer":
      return null;
  }
}

/**
 * Pulls the form's fields out of submitted FormData. Unknown keys are
 * ignored, so a client can't smuggle extra data into the answers column.
 */
export function readAnswersFromFormData(
  form: FormDefinition,
  formData: FormData,
): AnswerValues {
  const answers: AnswerValues = {};

  for (const field of form.fields) {
    if (field.kind === "checkboxes") {
      answers[field.name] = formData
        .getAll(field.name)
        .filter((value): value is string => typeof value === "string");
    } else {
      const value = formData.get(field.name);
      answers[field.name] = typeof value === "string" ? value.trim() : "";
    }
  }

  return answers;
}

/**
 * Narrows JSONB from the database to the form's fields. A draft may be
 * partial and the column could in principle hold anything, so each value is
 * checked rather than trusted.
 */
export function parseStoredAnswers(
  form: FormDefinition,
  stored: Record<string, unknown> | null | undefined,
): AnswerValues {
  const answers: AnswerValues = {};
  const source = stored ?? {};

  for (const field of form.fields) {
    const value = source[field.name];
    if (field.kind === "checkboxes") {
      answers[field.name] = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    } else {
      answers[field.name] = typeof value === "string" ? value : "";
    }
  }

  return answers;
}

/**
 * Validates answers against the form.
 *
 * "draft" checks only formats and lengths so a partially completed form can
 * be saved; "submit" additionally enforces required fields. The same
 * function runs on the server for every mutation.
 */
export function validateAnswers(
  form: FormDefinition,
  answers: AnswerValues,
  mode: "draft" | "submit",
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of form.fields) {
    const value = answers[field.name];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;

    if (isEmpty) {
      if (mode === "submit" && field.required) {
        errors[field.name] = "This field is required.";
      }
      continue;
    }

    const message = validateFilledField(field, value);
    if (message) {
      errors[field.name] = message;
    }
  }

  return errors;
}

function validateFilledField(
  field: FieldDefinition,
  value: string | string[],
): string | null {
  switch (field.kind) {
    case "text":
    case "textarea":
    case "url": {
      if (typeof value !== "string") return "Invalid value.";
      if (value.length > field.maxLength) {
        return `Please keep this under ${field.maxLength} characters.`;
      }
      if (field.kind === "url" && !isHttpUrl(value)) {
        return "Enter a full URL starting with http:// or https://.";
      }
      return null;
    }
    case "select": {
      const isKnownOption = field.options.some((option) => option.value === value);
      return isKnownOption ? null : "Choose one of the listed options.";
    }
    case "checkboxes": {
      if (!Array.isArray(value)) return "Invalid value.";
      const allKnown = value.every((item) =>
        field.options.some((option) => option.value === item),
      );
      return allKnown ? null : "Choose only from the listed options.";
    }
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
