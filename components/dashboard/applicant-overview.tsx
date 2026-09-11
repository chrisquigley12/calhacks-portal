import Link from "next/link";

import {
  ApplicationStatusBadge,
  type DisplayStatus,
} from "@/components/applications/application-status-badge";
import { formatDate } from "@/components/applications/submitted-application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { getApplicationTypeLabel, type ApplicationType } from "@/lib/application-types";
import type { Application } from "@/lib/applications/types";

interface ApplicantOverviewProps {
  fullName: string;
  email: string | null;
  accountType: ApplicationType;
  application: Application | null;
}

/**
 * The applicant's one card: who they are, where their application stands,
 * and the single next action for that state.
 */
export function ApplicantOverview({
  fullName,
  email,
  accountType,
  application,
}: ApplicantOverviewProps) {
  const typeLabel = getApplicationTypeLabel(accountType);
  const status = application ? application.status : "not-started";
  const next = NEXT_STEP_BY_STATUS[status];

  const details = [
    { label: "Name", value: fullName },
    { label: "Email", value: email ?? "—" },
    { label: "Applying as", value: <Badge tone="info">{typeLabel}</Badge> },
  ];

  if (application && application.status !== "draft") {
    details.push({ label: "Submitted", value: formatDate(application.submitted_at) });
  } else if (application) {
    details.push({ label: "Last saved", value: formatDate(application.updated_at) });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>{typeLabel} application</CardTitle>
          <CardDescription>{next.description}</CardDescription>
        </div>
        <ApplicationStatusBadge status={status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <DescriptionList items={details} />
        <div>
          <Button asChild variant={next.variant}>
            <Link href="/apply">{next.label}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NextStep {
  label: string;
  description: string;
  variant: "default" | "outline";
}

const VIEW_STEP: NextStep = {
  label: "View application",
  description: "Your application is submitted. We'll be in touch once it has been reviewed.",
  variant: "outline",
};

const NEXT_STEP_BY_STATUS: Record<DisplayStatus, NextStep> = {
  "not-started": {
    label: "Start application",
    description: "You haven't started your application yet. It takes about ten minutes.",
    variant: "default",
  },
  draft: {
    label: "Continue application",
    description: "You have a draft in progress. Finish it and submit when you're ready.",
    variant: "default",
  },
  submitted: VIEW_STEP,
  reviewed: VIEW_STEP,
  accepted: {
    ...VIEW_STEP,
    description: "Congratulations — you're in! Keep an eye on your email for next steps.",
  },
  rejected: {
    ...VIEW_STEP,
    description: "Thank you for applying. We weren't able to offer you a spot this time.",
  },
};
