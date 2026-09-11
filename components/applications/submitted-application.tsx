import { CheckCircle2 } from "lucide-react";

import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ApplicationResponses } from "@/components/organizer/application-responses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnswerValues, FormDefinition } from "@/lib/applications/forms";
import type { Application } from "@/lib/applications/types";

interface SubmittedApplicationProps {
  form: FormDefinition;
  application: Application;
  answers: AnswerValues;
  /** True right after submission, to show a one-time confirmation. */
  justSubmitted: boolean;
}

/** Read-only view of a submitted application, with answers labeled by question. */
export function SubmittedApplication({
  form,
  application,
  answers,
  justSubmitted,
}: SubmittedApplicationProps) {
  return (
    <div className="flex flex-col gap-6">
      {justSubmitted && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Your application is in. We&apos;ll email you when there&apos;s a
            decision, and you can check your status on the dashboard any time.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{form.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Submitted {formatDate(application.submitted_at)}. Submitted
              applications can&apos;t be edited.
            </p>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </CardHeader>
        <CardContent>
          <ApplicationResponses form={form} answers={answers} />
        </CardContent>
      </Card>
    </div>
  );
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
