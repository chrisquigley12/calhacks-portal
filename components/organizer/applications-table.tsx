import Link from "next/link";

import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { formatDate } from "@/components/applications/submitted-application";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApplicationTypeLabel } from "@/lib/application-types";
import type { OrganizerApplication } from "@/lib/applications/types";

interface ApplicationsTableProps {
  applications: OrganizerApplication[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Submitted applications will appear here as they come in."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Applicant</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id}>
            <TableCell className="font-medium">{application.applicant_name}</TableCell>
            <TableCell>
              <Badge tone="neutral">{getApplicationTypeLabel(application.application_type)}</Badge>
            </TableCell>
            <TableCell>
              <ApplicationStatusBadge status={application.status} />
            </TableCell>
            <TableCell className="tabular-nums">{application.score ?? "—"}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(application.submitted_at)}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/organizer/applications/${application.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Review
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
