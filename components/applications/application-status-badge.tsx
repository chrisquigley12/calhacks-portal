import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/applications/types";

/** "not-started" is not a database status; it means no row exists yet. */
export type DisplayStatus = ApplicationStatus | "not-started";

export const STATUS_PRESENTATION: Record<
  DisplayStatus,
  { label: string; tone: BadgeProps["tone"] }
> = {
  "not-started": { label: "Not started", tone: "neutral" },
  draft: { label: "Draft", tone: "warning" },
  submitted: { label: "Submitted", tone: "info" },
  reviewed: { label: "Reviewed", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function ApplicationStatusBadge({ status }: { status: DisplayStatus }) {
  const { label, tone } = STATUS_PRESENTATION[status];
  return <Badge tone={tone}>{label}</Badge>;
}
