import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The signed-in user as seen by server code. Built from the verified session
 * JWT, so every field here comes from Supabase Auth, not from the request.
 */
export interface CurrentUser {
  id: string;
  email: string | null;
  /**
   * Values the user supplied at sign-up, stored in Supabase Auth user
   * metadata. They are user-controlled and must be validated before use —
   * see ensureApplicantProfile().
   */
  signUpMetadata: {
    fullName: string | null;
    accountType: string | null;
  };
}

/**
 * Returns the authenticated user for this request, or null when signed out.
 *
 * getClaims() verifies the JWT signature locally and returns its claims,
 * which is cheaper than getUser() (a network round-trip) while still
 * refusing forged or expired tokens.
 */
export async function getCurrentUser(
  supabase: SupabaseClient,
): Promise<CurrentUser | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const claims = data.claims;
  const metadata = claims.user_metadata ?? {};

  return {
    id: claims.sub,
    email: claims.email ?? null,
    signUpMetadata: {
      fullName: readString(metadata.full_name),
      accountType: readString(metadata.account_type),
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
