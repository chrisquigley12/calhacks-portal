import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { ensureApplicantProfile, type Profile } from "@/lib/profiles";

/**
 * A minimal stand-in for the Supabase query builder. Each test decides what
 * the "profiles" table looks like; the fake records what gets inserted.
 */
function createFakeSupabase(existingProfile: Profile | null) {
  const insert = vi.fn();
  const insertedRows: Record<string, unknown>[] = [];

  const client = {
    from: (table: string) => {
      expect(table).toBe("profiles");
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: existingProfile, error: null }),
          }),
        }),
        insert: (row: Record<string, unknown>) => {
          insert(row);
          insertedRows.push(row);
          return {
            select: () => ({
              single: async () => ({
                data: { ...row, created_at: "2026-09-11T00:00:00Z" },
                error: null,
              }),
            }),
          };
        },
      };
    },
  };

  return { client: client as unknown as SupabaseClient, insert };
}

function makeUser(overrides: Partial<CurrentUser["signUpMetadata"]> = {}): CurrentUser {
  return {
    id: "user-123",
    email: "oski@berkeley.edu",
    signUpMetadata: { fullName: "Oski Bear", accountType: "hacker", ...overrides },
  };
}

describe("ensureApplicantProfile", () => {
  it("returns the existing profile without inserting", async () => {
    const existing: Profile = {
      id: "user-123",
      full_name: "Oski Bear",
      account_type: "volunteer",
      created_at: "2026-09-01T00:00:00Z",
    };
    const { client, insert } = createFakeSupabase(existing);

    const profile = await ensureApplicantProfile(client, makeUser());

    expect(profile).toEqual(existing);
    expect(insert).not.toHaveBeenCalled();
  });

  it("creates the profile from validated sign-up metadata using the session user id", async () => {
    const { client, insert } = createFakeSupabase(null);

    const profile = await ensureApplicantProfile(
      client,
      makeUser({ accountType: "volunteer" }),
    );

    expect(insert).toHaveBeenCalledWith({
      id: "user-123",
      full_name: "Oski Bear",
      account_type: "volunteer",
    });
    expect(profile.account_type).toBe("volunteer");
  });

  it("refuses to create an organizer profile from user-controlled metadata", async () => {
    const { client, insert } = createFakeSupabase(null);

    await expect(
      ensureApplicantProfile(client, makeUser({ accountType: "organizer" })),
    ).rejects.toThrow(/valid applicant type/);
    expect(insert).not.toHaveBeenCalled();
  });
});
