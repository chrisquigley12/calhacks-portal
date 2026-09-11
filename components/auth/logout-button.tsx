"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Refresh so server components (like the header) re-render without a user.
    router.push("/");
    router.refresh();
  }

  return (
    <Button onClick={handleLogout} size="sm" variant="outline">
      Sign out
    </Button>
  );
}
