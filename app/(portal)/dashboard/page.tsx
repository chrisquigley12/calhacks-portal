import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Applicant dashboard. Unauthenticated visitors are redirected to sign-in by
 * the session proxy (see lib/supabase/proxy.ts). Application data arrives in
 * a later phase; for now this renders the empty state.
 */
export default function DashboardPage() {
  return (
    <PageContainer className="pb-20">
      <PageHeader
        eyebrow="Applicant"
        title="Your application"
        description="Track your Cal Hacks application and its status here."
      />
      <EmptyState
        icon={<FileText aria-hidden="true" className="size-5" />}
        title="No application yet"
        description="Applications open soon. When they do, you'll be able to start and submit yours from this page."
      />
    </PageContainer>
  );
}
