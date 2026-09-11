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

/** What supabase.auth.signUp() resolves to when "Confirm email" is enabled. */
const CONFIRMATION_REQUIRED = {
  data: { user: { id: "user-1" }, session: null },
  error: null,
};

/** What it resolves to when "Confirm email" is disabled: a live session. */
const SIGNED_IN_IMMEDIATELY = {
  data: {
    user: { id: "user-1" },
    session: { access_token: "token", user: { id: "user-1" } },
  },
  error: null,
};

describe("SignUpForm", () => {
  beforeEach(() => {
    signUp.mockReset().mockResolvedValue(CONFIRMATION_REQUIRED);
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
    expect(submitted.options.data).toEqual({
      full_name: "Oski Bear",
      account_type: "volunteer",
    });
  });

  it("sends the user to check their email when confirmation is required (no session)", async () => {
    signUp.mockResolvedValue(CONFIRMATION_REQUIRED);
    render(<SignUpForm />);
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/auth/sign-up-success");
  });

  it("goes straight to the dashboard when Supabase returns a session (confirmation disabled)", async () => {
    signUp.mockResolvedValue(SIGNED_IN_IMMEDIATELY);
    render(<SignUpForm />);
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("stores the same metadata regardless of the confirmation setting", async () => {
    signUp.mockResolvedValue(SIGNED_IN_IMMEDIATELY);
    render(<SignUpForm initialAccountType="volunteer" />);
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUp.mock.calls[0][0].options.data).toEqual({
      full_name: "Oski Bear",
      account_type: "volunteer",
    });
  });

  it("never submits an organizer account type from the public form", async () => {
    render(<SignUpForm />);

    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByRole("radio", { name: /organizer/i })).not.toBeInTheDocument();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(signUp.mock.calls[0][0].options.data.account_type).not.toBe("organizer");
  });

  it("shows the error and stays on the form when sign-up fails", async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    render(<SignUpForm />);
    await fillRequiredFields();

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert")).toHaveTextContent("User already registered");
    expect(push).not.toHaveBeenCalled();
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
