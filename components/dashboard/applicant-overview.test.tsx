import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApplicantOverview } from "@/components/dashboard/applicant-overview";
import type { Application } from "@/lib/applications/types";

const baseProps = {
  fullName: "Oski Bear",
  email: "oski@berkeley.edu",
  accountType: "hacker" as const,
};

const draft: Application = {
  id: "app-1",
  user_id: "user-123",
  application_type: "hacker",
  status: "draft",
  responses: {},
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
  submitted_at: null,
};

describe("ApplicantOverview", () => {
  it("prompts to start when there is no application", () => {
    render(<ApplicantOverview {...baseProps} application={null} />);

    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start application" })).toHaveAttribute("href", "/apply");
  });

  it("prompts to continue a draft", () => {
    render(<ApplicantOverview {...baseProps} application={draft} />);

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue application" })).toBeInTheDocument();
  });

  it("shows submitted state with a view link", () => {
    render(
      <ApplicantOverview
        {...baseProps}
        application={{ ...draft, status: "submitted", submitted_at: "2026-09-11T17:00:00Z" }}
      />,
    );

    expect(screen.getByText("Submitted", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View application" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /start|continue/i })).not.toBeInTheDocument();
  });

  it("shows a public decision without leaking organizer-only review data", () => {
    // Even if a row somehow carried review fields, the overview never renders them.
    const reviewed = {
      ...draft,
      status: "accepted" as const,
      submitted_at: "2026-09-11T17:00:00Z",
      score: 8,
      reviewer_notes: "Strong application",
    };
    render(<ApplicantOverview {...baseProps} application={reviewed} />);

    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View application" })).toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
    expect(screen.queryByText(/Strong application/)).not.toBeInTheDocument();
  });
});
