import { APPLICATION_TYPES, type ApplicationType } from "@/lib/application-types";

/**
 * Every role a profile can have. Applicant types come from
 * lib/application-types.ts; "organizer" is the internal reviewer role.
 *
 * These strings match the allowed values of `profiles.account_type` in the
 * database exactly.
 */
export type AccountType = ApplicationType | "organizer";

/**
 * The only account types a visitor may choose for themselves.
 *
 * Organizer privileges are assigned administratively (directly in the
 * database) and are never derived from user-controlled sign-up input. This
 * allowlist is enforced in application code in addition to database RLS so
 * an attacker can't gain organizer access by editing a query parameter or
 * their own auth metadata.
 */
export const PUBLIC_ACCOUNT_TYPES: readonly ApplicationType[] =
  APPLICATION_TYPES.map((type) => type.value);

export const DEFAULT_PUBLIC_ACCOUNT_TYPE: ApplicationType = "hacker";

/**
 * Converts untrusted input (a query parameter, form value, or auth metadata)
 * into a public account type. Returns null for anything not on the
 * allowlist — including "organizer" — so callers must decide how to handle
 * the rejection explicitly.
 */
export function parsePublicAccountType(value: unknown): ApplicationType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const match = PUBLIC_ACCOUNT_TYPES.find((type) => type === normalized);
  return match ?? null;
}

/** Type guard: narrows an AccountType to the organizer role or an applicant type. */
export function isOrganizer(accountType: AccountType): accountType is "organizer" {
  return accountType === "organizer";
}
