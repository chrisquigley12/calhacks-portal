import type { SupabaseClient } from "@supabase/supabase-js";

import { parsePublicAccountType, type AccountType } from "@/lib/account-types";
import type { CurrentUser } from "@/lib/auth/current-user";

/** A row in public.profiles. */
export interface Profile {
  id: string;
  full_name: string;
  account_type: AccountType;
  created_at: string;
}

const PROFILE_COLUMNS = "id, full_name, account_type, created_at";

/** Postgres error code for a unique-constraint violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Loads the profile for a user id. Returns null when none exists yet.
 * Throws on database errors (including RLS denials) so callers surface them
 * instead of treating a broken policy as "no profile".
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return (data as Profile | null) ?? null;
}

/**
 * Guarantees the signed-in applicant has a profile row and returns it.
 *
 * Why create profiles here instead of at sign-up: with email confirmation
 * enabled, signUp() does not produce a usable session, so the browser can't
 * insert a row at that moment. Instead the chosen name and account type ride
 * along in auth metadata, and the first authenticated page visit turns them
 * into a profile. The function is idempotent — calling it again is a no-op.
 *
 * Security: the row id is always the authenticated user's id (never a value
 * from the request), and the account type is re-validated against the public
 * allowlist. Metadata claiming "organizer" is rejected, not honored.
 */
export async function ensureApplicantProfile(
  supabase: SupabaseClient,
  user: CurrentUser,
): Promise<Profile> {
  const existingProfile = await getProfile(supabase, user.id);
  if (existingProfile) {
    return existingProfile;
  }

  const accountType = parsePublicAccountType(user.signUpMetadata.accountType);
  if (!accountType) {
    throw new Error(
      "Your account does not have a valid applicant type. Please contact the organizers.",
    );
  }

  const fullName = user.signUpMetadata.fullName ?? user.email ?? "Applicant";

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, full_name: fullName, account_type: accountType })
    .select(PROFILE_COLUMNS)
    .single();

  // Two requests (e.g. two tabs) can race to create the same profile. The
  // primary key rejects the second insert; reading the row back is correct.
  if (error?.code === UNIQUE_VIOLATION) {
    const createdByOtherRequest = await getProfile(supabase, user.id);
    if (createdByOtherRequest) {
      return createdByOtherRequest;
    }
  }

  if (error) {
    throw new Error(`Could not create profile: ${error.message}`);
  }

  return data as Profile;
}
