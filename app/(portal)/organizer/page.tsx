import type { Metadata } from "next";
import { Suspense } from "react";

import { ApplicationsTable } from "@/components/organizer/applications-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { requireOrganizer } from "@/lib/auth/require-organizer";
import { listApplicationsForOrganizer } from "@/lib/organizer/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Applications" };

export default function OrganizerPage() {
  return (
    <PageContainer className="pb-20">
      <Suspense fallback={<div className="py-10 text-sm text-muted-foreground">Loading…</div>}>
        <OrganizerContent />
      </Suspense>
    </PageContainer>
  );
}

async function OrganizerContent() {
  await requireOrganizer();
  const supabase = await createClient();
  const applications = await listApplicationsForOrganizer(supabase);

  const awaitingReview = applications.filter((application) => application.status === "submitted").length;

  return (
    <>
      <PageHeader
        eyebrow="Organizer"
        title="Applications"
        description={
          applications.length === 0
            ? "Every submitted application, with its current status."
            : `${applications.length} submitted · ${awaitingReview} awaiting review`
        }
      />
      <ApplicationsTable applications={applications} />
    </>
  );
}
