import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { reviewApplicationAction } from "@/app/(portal)/organizer/applications/[id]/actions";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { formatDate } from "@/components/applications/submitted-application";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationResponses } from "@/components/organizer/application-responses";
import { ReviewForm } from "@/components/organizer/review-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { getApplicationTypeLabel } from "@/lib/application-types";
import { getFormDefinition, parseStoredAnswers } from "@/lib/applications/forms";
import { requireOrganizer } from "@/lib/auth/require-organizer";
import { getApplicationForOrganizer } from "@/lib/organizer/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review application" };

type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <PageContainer className="pb-20">
      <Suspense fallback={<div className="py-10 text-sm text-muted-foreground">Loading…</div>}>
        <ReviewContent params={params} />
      </Suspense>
    </PageContainer>
  );
}

async function ReviewContent({ params }: ReviewPageProps) {
  await requireOrganizer();
  const { id } = await params;

  const supabase = await createClient();
  const application = await getApplicationForOrganizer(supabase, id);
  if (!application) {
    notFound();
  }

  const form = getFormDefinition(application.application_type);
  const answers = parseStoredAnswers(form!, application.responses);
  const typeLabel = getApplicationTypeLabel(application.application_type);

  // The action is bound to this application's id on the server, so the
  // browser can't redirect a review to a different application.
  const reviewThisApplication = reviewApplicationAction.bind(null, application.id);

  return (
    <>
      <div className="pt-8">
        <Link href="/organizer" className="text-sm text-muted-foreground hover:underline">
          ← All applications
        </Link>
      </div>
      <PageHeader
        eyebrow="Review"
        title={application.applicant_name}
        actions={
          <>
            <Badge tone="neutral">{typeLabel}</Badge>
            <ApplicationStatusBadge status={application.status} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={[
                  { label: "Name", value: application.applicant_name },
                  { label: "Type", value: typeLabel },
                  { label: "Submitted", value: formatDate(application.submitted_at) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{form!.title}</CardTitle>
              <CardDescription>The applicant&apos;s responses, in the order asked.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationResponses form={form!} answers={answers} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Review</CardTitle>
            <CardDescription>Set a status, score, and notes for the team.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewForm application={application} action={reviewThisApplication} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
