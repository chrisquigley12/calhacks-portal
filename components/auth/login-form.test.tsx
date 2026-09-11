import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

const signInWithPassword = vi.fn();
const push = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

async function signIn() {
  await userEvent.type(screen.getByLabelText("Email"), "someone@berkeley.edu");
  await userEvent.type(screen.getByLabelText("Password"), "correct-horse");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset().mockResolvedValue({ error: null });
    push.mockReset();
  });

  it("applicant mode offers account creation and lands on the dashboard", async () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/auth/sign-up");

    await signIn();

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "someone@berkeley.edu",
      password: "correct-horse",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("organizer mode hides sign-up, explains provisioning, and requests /organizer", async () => {
    render(<LoginForm mode="organizer" />);

    expect(screen.getByRole("heading", { name: "Organizer sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create an account" })).not.toBeInTheDocument();
    expect(screen.getByText(/provisioned by the Cal Hacks team/i)).toBeInTheDocument();

    await signIn();

    // Same credentials call in both modes: mode changes the destination
    // only, and /organizer itself decides whether the user may enter.
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "someone@berkeley.edu",
      password: "correct-horse",
    });
    expect(push).toHaveBeenCalledWith("/organizer");
  });

  it("shows the sign-in error and does not navigate", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    render(<LoginForm />);

    await signIn();

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid login credentials");
    expect(push).not.toHaveBeenCalled();
  });
});
