import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApplicationForm } from "@/components/applications/application-form";
import { getFormDefinition, parseStoredAnswers, type FormDefinition } from "@/lib/applications/forms";
import type { SaveApplicationState } from "@/lib/applications/save-state";

type SaveAction = (state: SaveApplicationState, formData: FormData) => Promise<SaveApplicationState>;

const hackerForm = getFormDefinition("hacker") as FormDefinition;
const volunteerForm = getFormDefinition("volunteer") as FormDefinition;

function renderForm(form: FormDefinition, action = vi.fn()) {
  render(
    <ApplicationForm
      form={form}
      initialAnswers={parseStoredAnswers(form, null)}
      action={action}
    />,
  );
}

describe("ApplicationForm", () => {
  it("shows hacker questions only, with no way to switch to the volunteer form", () => {
    renderForm(hackerForm);

    expect(screen.getByLabelText("What would you like to build or learn?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Availability")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/volunteer/i)).not.toBeInTheDocument();
  });

  it("shows volunteer questions only, with no way to switch to the hacker form", () => {
    renderForm(volunteerForm);

    expect(screen.getByLabelText("Availability")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Meals and snacks" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Major or field of study")).not.toBeInTheDocument();
    expect(screen.queryByText(/hacker/i)).not.toBeInTheDocument();
  });

  it("offers both save-draft and submit actions and warns that submission is final", () => {
    renderForm(hackerForm);

    expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit application" })).toBeInTheDocument();
    expect(screen.getByText(/can't be edited/i)).toBeInTheDocument();
  });

  it("shows field errors returned by the server next to the fields", async () => {
    const rejectingAction = vi.fn<SaveAction>(async () => ({
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: { school: "This field is required." },
    }));
    renderForm(hackerForm, rejectingAction);

    await userEvent.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByText("This field is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("School")).toHaveAttribute("aria-invalid", "true");
    expect(rejectingAction).toHaveBeenCalledTimes(1);

    // The clicked button's intent travels with the form data.
    const submittedFormData = rejectingAction.mock.calls[0][1];
    expect(submittedFormData.get("intent")).toBe("submit");
  });

  it("keeps the entered values on screen after saving a draft", async () => {
    const savingAction = vi.fn<SaveAction>(async () => ({
      status: "saved",
      message: "Draft saved.",
      fieldErrors: {},
    }));
    renderForm(hackerForm, savingAction);

    await userEvent.type(screen.getByLabelText("School"), "UC Berkeley");
    await userEvent.selectOptions(screen.getByLabelText("Expected graduation year"), "2028");
    await userEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Draft saved.");
    expect(screen.getByLabelText("School")).toHaveValue("UC Berkeley");
    expect(screen.getByLabelText("Expected graduation year")).toHaveValue("2028");

    const submittedFormData = savingAction.mock.calls[0][1];
    expect(submittedFormData.get("intent")).toBe("draft");
    expect(submittedFormData.get("graduationYear")).toBe("2028");
  });
});
