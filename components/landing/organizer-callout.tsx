import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

/**
 * A short note for the internal audience. Organizer accounts are created by
 * the team, not through public sign-up, so this only offers sign-in.
 */
export function OrganizerCallout() {
  return (
    <section>
      <PageContainer className="flex flex-col gap-6 py-20 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-sm font-medium text-primary">For organizers</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Review applications with focus
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            See every application and its status, grade submissions, and hide
            identifying details during first-pass review.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/auth/login?role=organizer">Organizer sign in</Link>
        </Button>
      </PageContainer>
    </section>
  );
}
