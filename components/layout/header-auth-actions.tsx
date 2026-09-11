import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign in / sign up links for visitors, or the account menu for signed-in
 * users. This is a server component: it reads the session from cookies via
 * the Supabase server client, so the correct state is rendered on first paint.
 *
 * getClaims() verifies the JWT locally instead of calling Supabase on every
 * request, which is why it is preferred over getUser() here.
 */
export async function HeaderAuthActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

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

  return (
    <nav aria-label="Account" className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.email}
      </span>
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <LogoutButton />
    </nav>
  );
}
