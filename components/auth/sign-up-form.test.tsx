import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "@/components/auth/sign-up-form";

// Supabase and the router are mocked at the module boundary so the test
// exercises the form's behavior without a network or a Next.js runtime.
const signUp = vi.fn();
const push = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signUp } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText("Full name"), "Oski Bear");
  await userEvent.type(screen.getByLabelText("Email"), "oski@berkeley.edu");
  await userEvent.type(screen.getByLabelText("Password"), "correct-horse");
  await userEvent.type(screen.getByLabelText("Confirm password"), "correct-horse");
}

describe("SignUpForm", () => {
  beforeEach(() => {
    signUp.mockReset().mockResolvedValue({ error: null });
    push.mockReset();
  });

  it("defaults to Hacker and never offers Organizer", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("radio", { name: "Hacker" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Volunteer" })).not.toBeChecked();
    expect(screen.queryByRole("radio", { name: "Organizer" })).not.toBeInTheDocument();
  });

  it("preselects the type passed from the landing page link", () => {
    render(<SignUpForm initialAccountType="volunteer" />);

    expect(screen.getByRole("radio", { name: "Volunteer" })).toBeChecked();
  });

  it("signs up a hacker with their name and type stored as auth metadata", async () => {
    render(<SignUpForm />);
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "oski@berkeley.edu",
        password: "correct-horse",
        options: expect.objectContaining({
          data: { full_name: "Oski Bear", account_type: "hacker" },
        }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/auth/sign-up-success");
  });

  it("lets the user switch to Volunteer before submitting", async () => {
    render(<SignUpForm />);
    await userEvent.click(screen.getByRole("radio", { name: "Volunteer" }));
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    const submitted = signUp.mock.calls[0][0];
    expect(submitted.options.data.account_type).toBe("volunteer");
  });

  it("blocks submission when the passwords differ", async () => {
    render(<SignUpForm />);
    await userEvent.type(screen.getByLabelText("Full name"), "Oski Bear");
    await userEvent.type(screen.getByLabelText("Email"), "oski@berkeley.edu");
    await userEvent.type(screen.getByLabelText("Password"), "one-password");
    await userEvent.type(screen.getByLabelText("Confirm password"), "another");

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(signUp).not.toHaveBeenCalled();
  });
});
