import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

function renderEmailField(options: { hint?: string; error?: string } = {}) {
  return render(
    <FormField id="email" label="Email" hint={options.hint} error={options.error}>
      {(controlProps) => <Input {...controlProps} type="email" />}
    </FormField>,
  );
}

describe("FormField", () => {
  it("associates the label with the control", () => {
    renderEmailField();

    // getByLabelText only succeeds if the <label> is correctly linked.
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
  });

  it("links the hint to the control for screen readers", () => {
    renderEmailField({ hint: "We'll only use this to contact you." });

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-describedby", "email-hint");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and announces the error", () => {
    renderEmailField({
      hint: "We'll only use this to contact you.",
      error: "Enter a valid email address.",
    });

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
    // The hint is replaced by the error so the two don't compete.
    expect(
      screen.queryByText("We'll only use this to contact you."),
    ).not.toBeInTheDocument();
  });
});
