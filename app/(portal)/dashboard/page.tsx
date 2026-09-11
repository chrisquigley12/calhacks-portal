import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ApplicantOverview } from "@/components/dashboard/applicant-overview";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { isOrganizer } from "@/lib/account-types";
import { getApplicationForUser } from "@/lib/applications/queries";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { ensureApplicantProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Applicant dashboard.
 *
 * Auth-dependent work happens in DashboardContent, which reads the session
 * cookie and therefore renders dynamically inside a Suspense boundary; the
 * page shell around it is still prerendered.
 */
export default function DashboardPage() {
  return (
    <PageContainer className="pb-20">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageContainer>
  );
}

async function DashboardContent() {
  const user = await requireCurrentUser();

  const supabase = await createClient();
  const profile = await ensureApplicantProfile(supabase, user).catch(
    redirectToAuthError,
  );

  // Organizers have their own workspace; nothing applicant-shaped applies.
  if (isOrganizer(profile.account_type)) {
    redirect("/organizer");
  }

  const application = await getApplicationForUser(supabase, user.id).catch(
    redirectToAuthError,
  );

  return (
    <>
      <PageHeader
        eyebrow="Applicant"
        title={`Welcome, ${firstNameOf(profile.full_name)}`}
        description="Here's where your Cal Hacks application stands."
      />
      <ApplicantOverview
        fullName={profile.full_name}
        email={user.email}
        accountType={profile.account_type}
        application={application}
      />
    </>
  );
}

/**
 * A missing RLS policy or invalid sign-up metadata lands here. Surface it on
 * the auth error page rather than rendering a broken dashboard.
 */
function redirectToAuthError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Unknown error";
  redirect(`/auth/error?error=${encodeURIComponent(message)}`);
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Mirrors the layout of the loaded page so nothing jumps when data arrives. */
function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your dashboard">
      <div className="flex flex-col gap-3 py-10">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>
      <div className="h-64 rounded-lg border bg-muted/40" />
    </div>
  );
}
