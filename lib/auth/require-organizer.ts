import { redirect } from "next/navigation";

import { isOrganizer } from "@/lib/account-types";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getProfile, type Profile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * For organizer-only pages and actions. The role comes from the profiles
 * table (set administratively), never from sign-up metadata. Applicants who
 * type an organizer URL are sent to their own dashboard.
 *
 * The database independently enforces the same rule: organizer reads go
 * through a view and writes through a function that both check
 * is_organizer(), so this guard is for routing and UX, not the only defense.
 */
export async function requireOrganizer(): Promise<Profile> {
  const user = await requireCurrentUser();
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  if (!profile || !isOrganizer(profile.account_type)) {
    redirect("/dashboard");
  }

  return profile;
}
