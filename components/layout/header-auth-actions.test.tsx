import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderAuthActions } from "@/components/layout/header-auth-actions";

const getClaims = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const signedInClaims = {
  data: {
    claims: {
      sub: "user-123",
      email: "oski@berkeley.edu",
      user_metadata: { full_name: "Oski Bear", account_type: "hacker" },
    },
  },
  error: null,
};

// LogoutButton uses the router and browser client; neither matters here.
vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Sign out</button>,
}));

// HeaderAuthActions is an async server component. Awaiting it yields the
// element tree it would send to the browser, which we can render as usual.
async function renderHeaderAuthActions() {
  render(await HeaderAuthActions());
}

describe("HeaderAuthActions", () => {
  beforeEach(() => {
    getClaims.mockReset();
    maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  });

  it("shows sign-in and apply links when signed out", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await renderHeaderAuthActions();

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login");
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/auth/sign-up");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows the user's name, dashboard link, and sign out when signed in as an applicant", async () => {
    getClaims.mockResolvedValue(signedInClaims);
    maybeSingle.mockResolvedValue({
      data: { id: "user-123", full_name: "Oski Bear", account_type: "hacker" },
      error: null,
    });

    await renderHeaderAuthActions();

    expect(screen.getByText("Oski Bear")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Applications" })).not.toBeInTheDocument();
  });

  it("shows organizer navigation only when the profile says organizer", async () => {
    // Metadata still claims "hacker"; the profiles table is what decides.
    getClaims.mockResolvedValue(signedInClaims);
    maybeSingle.mockResolvedValue({
      data: { id: "user-123", full_name: "Oski Bear", account_type: "organizer" },
      error: null,
    });

    await renderHeaderAuthActions();

    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", "/organizer");
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });
});
