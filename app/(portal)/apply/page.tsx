import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { saveApplicationAction } from "@/app/(portal)/apply/actions";
import { ApplicationForm } from "@/components/applications/application-form";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { SubmittedApplication } from "@/components/applications/submitted-application";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { isOrganizer } from "@/lib/account-types";
import { getApplicationTypeLabel } from "@/lib/application-types";
import { getFormDefinition, parseStoredAnswers } from "@/lib/applications/forms";
import { getApplicationForUser } from "@/lib/applications/queries";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your application" };

type ApplyPageProps = {
  searchParams: Promise<{ submitted?: string }>;
};

export default function ApplyPage({ searchParams }: ApplyPageProps) {
  return (
    <PageContainer width="narrow" className="pb-20">
      <Suspense fallback={<div className="py-10 text-sm text-muted-foreground">Loading…</div>}>
        <ApplyContent searchParams={searchParams} />
      </Suspense>
    </PageContainer>
  );
}

/**
 * Decides what the applicant sees. The form type is chosen from
 * profiles.account_type on the server; the browser has no say in it.
 */
async function ApplyContent({ searchParams }: ApplyPageProps) {
  const user = await requireCurrentUser();
  const supabase = await createClient();

  // The dashboard creates the profile on first visit; without one there is
  // nothing to base the form on, so send the user there.
  const profile = await getProfile(supabase, user.id);
  if (!profile || isOrganizer(profile.account_type)) {
    redirect("/dashboard");
  }

  const form = getFormDefinition(profile.account_type);
  if (!form) {
    redirect("/dashboard");
  }

  const application = await getApplicationForUser(supabase, user.id);
  const answers = parseStoredAnswers(form, application?.responses);
  const typeLabel = getApplicationTypeLabel(profile.account_type);

  // Anything past draft is read-only for the applicant.
  if (application && application.status !== "draft") {
    const params = await searchParams;
    return (
      <>
        <PageHeader
          eyebrow="Applicant"
          title="Your application"
          actions={<Badge tone="info">{typeLabel}</Badge>}
        />
        <SubmittedApplication
          form={form}
          application={application}
          answers={answers}
          justSubmitted={params.submitted === "1"}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Applicant"
        title={form.title}
        description={form.description}
        actions={
          <>
            <Badge tone="info">{typeLabel}</Badge>
            <ApplicationStatusBadge status={application ? application.status : "not-started"} />
          </>
        }
      />
      <ApplicationForm form={form} initialAnswers={answers} action={saveApplicationAction} />
    </>
  );
}
