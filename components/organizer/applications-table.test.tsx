import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicationsTable } from "@/components/organizer/applications-table";
import type { OrganizerApplication } from "@/lib/applications/types";

const submitted: OrganizerApplication = {
  id: "app-1",
  application_type: "hacker",
  responses: {},
  status: "submitted",
  score: null,
  reviewer_notes: null,
  submitted_at: "2026-09-02T00:00:00Z",
  applicant_name: "Oski Bear",
};

describe("ApplicationsTable", () => {
  it("shows an empty state when nothing has been submitted", () => {
    render(<ApplicationsTable applications={[]} />);
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
  });

  it("lists each application with its type, status, score, and a review link", () => {
    render(
      <ApplicationsTable
        applications={[
          submitted,
          { ...submitted, id: "app-2", applicant_name: "Carol Christ", application_type: "volunteer", status: "accepted", score: 9 },
        ]}
      />,
    );

    const rows = screen.getAllByRole("row").slice(1); // skip the header row
    expect(rows).toHaveLength(2);

    expect(within(rows[0]).getByText("Oski Bear")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Hacker")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Submitted")).toBeInTheDocument();
    expect(within(rows[0]).getByText("—")).toBeInTheDocument();
    expect(within(rows[0]).getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/organizer/applications/app-1",
    );

    expect(within(rows[1]).getByText("Volunteer")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Accepted")).toBeInTheDocument();
    expect(within(rows[1]).getByText("9")).toBeInTheDocument();
  });
});
