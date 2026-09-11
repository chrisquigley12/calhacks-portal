import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireOrganizer } from "@/lib/auth/require-organizer";

const getClaims = vi.fn();
const maybeSingle = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));

const hackerClaims = {
  data: {
    claims: {
      sub: "user-123",
      email: "hacker@berkeley.edu",
      // Metadata can say anything; it must not matter.
      user_metadata: { full_name: "Some Hacker", account_type: "organizer" },
    },
  },
  error: null,
};

describe("requireOrganizer", () => {
  beforeEach(() => {
    getClaims.mockReset().mockResolvedValue(hackerClaims);
    maybeSingle.mockReset();
    redirect.mockClear();
  });

  it("sends a signed-out visitor to sign in", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(requireOrganizer()).rejects.toThrow("REDIRECT:/auth/login");
  });

  it("sends an applicant to their dashboard even if their metadata claims organizer", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "user-123", full_name: "Some Hacker", account_type: "hacker" },
      error: null,
    });

    await expect(requireOrganizer()).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("admits a user whose profile row says organizer", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "user-123", full_name: "Org Anizer", account_type: "organizer" },
      error: null,
    });

    const profile = await requireOrganizer();

    expect(profile.account_type).toBe("organizer");
    expect(redirect).not.toHaveBeenCalled();
  });
});
