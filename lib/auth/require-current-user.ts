import { redirect } from "next/navigation";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

/**
 * For pages that only make sense when signed in. Establishes the user from
 * the verified session on the server and redirects to sign-in otherwise.
 *
 * The session proxy (lib/supabase/proxy.ts) also redirects signed-out
 * visitors, but pages call this themselves so their security does not depend
 * on middleware configuration staying correct.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}
