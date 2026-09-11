import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReviewForm } from "@/components/organizer/review-form";
import type { OrganizerApplication } from "@/lib/applications/types";
import type { ReviewFormState } from "@/lib/organizer/review-state";

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

function outcomeSelect() {
  return screen.getByLabelText("Outcome") as HTMLSelectElement;
}

describe("ReviewForm", () => {
  it("defaults a freshly submitted application to Reviewed and never offers Submitted", () => {
    render(<ReviewForm application={submitted} action={vi.fn()} />);

    expect(outcomeSelect()).toHaveValue("reviewed");

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["Reviewed", "Accepted", "Rejected"]);
    expect(options).not.toContain("Submitted");
  });

  it.each([
    ["reviewed", "reviewed"],
    ["accepted", "accepted"],
    ["rejected", "rejected"],
  ] as const)("prepopulates a %s application with its recorded outcome", (status, expected) => {
    render(<ReviewForm application={{ ...submitted, status }} action={vi.fn()} />);
    expect(outcomeSelect()).toHaveValue(expected);
  });

  it("prepopulates the saved score and notes", () => {
    render(
      <ReviewForm
        application={{ ...submitted, status: "accepted", score: 8, reviewer_notes: "Strong application" }}
        action={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Score")).toHaveValue(8);
    expect(screen.getByLabelText("Reviewer notes")).toHaveValue("Strong application");
  });

  it("shows success feedback after a save and keeps the entered values on screen", async () => {
    const action = vi.fn(async (): Promise<ReviewFormState> => ({
      status: "saved",
      message: "Review saved.",
      fieldErrors: {},
    }));
    render(<ReviewForm application={submitted} action={action} />);

    await userEvent.selectOptions(outcomeSelect(), "accepted");
    await userEvent.type(screen.getByLabelText("Score"), "8");
    await userEvent.click(screen.getByRole("button", { name: "Save review" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Review saved.");
    expect(outcomeSelect()).toHaveValue("accepted");
    expect(screen.getByLabelText("Score")).toHaveValue(8);
  });

  it("surfaces a database error instead of pretending the save worked", async () => {
    const action = vi.fn(async (): Promise<ReviewFormState> => ({
      status: "error",
      message: "Could not save review: Only organizers can review applications",
      fieldErrors: {},
    }));
    render(<ReviewForm application={submitted} action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Save review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Only organizers/);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
