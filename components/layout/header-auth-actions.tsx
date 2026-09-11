import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { isOrganizer } from "@/lib/account-types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign in / apply links for visitors, or dashboard + sign out for signed-in
 * users. This is a server component: it reads the verified session on the
 * server so the correct state is rendered on first paint.
 *
 * The displayed name comes from sign-up metadata, which is fine for a
 * greeting. The organizer link is based on the profiles table, never on
 * metadata — and it is only navigation: the organizer pages verify the role
 * themselves.
 */
export async function HeaderAuthActions() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <nav aria-label="Account" className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Apply</Link>
        </Button>
      </nav>
    );
  }

  const displayName = user.signUpMetadata.fullName ?? user.email;
  // A missing profile just means the applicant view; the dashboard creates it.
  const profile = await getProfile(supabase, user.id).catch(() => null);
  const showOrganizerLinks = profile !== null && isOrganizer(profile.account_type);

  return (
    <nav aria-label="Account" className="flex items-center gap-3">
      {displayName && (
        <span className="hidden max-w-[16rem] truncate text-sm text-muted-foreground sm:inline">
          {displayName}
        </span>
      )}
      {showOrganizerLinks ? (
        <Button asChild size="sm" variant="ghost">
          <Link href="/organizer">Applications</Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      )}
      <LogoutButton />
    </nav>
  );
}
