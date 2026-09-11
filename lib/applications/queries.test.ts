import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  createApplicationDraft,
  getApplicationForUser,
  submitApplication,
  updateApplicationDraft,
} from "@/lib/applications/queries";
import type { Application } from "@/lib/applications/types";

const draft: Application = {
  id: "app-1",
  user_id: "user-123",
  application_type: "hacker",
  status: "draft",
  responses: { school: "UC Berkeley" },
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  submitted_at: null,
};

/**
 * Records the query each helper builds and replies with a canned row. Tests
 * assert on the recorded filters and payloads, which is what actually
 * matters for correctness and security here.
 */
function createFakeSupabase(reply: { data: unknown; error?: { message: string } | null }) {
  const calls = {
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
  };

  const terminal = async () => ({ data: reply.data, error: reply.error ?? null });
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = (column: string, value: unknown) => {
    calls.eq(column, value);
    return builder;
  };
  builder.insert = (row: unknown) => {
    calls.insert(row);
    return builder;
  };
  builder.update = (changes: unknown) => {
    calls.update(changes);
    return builder;
  };
  builder.maybeSingle = terminal;
  builder.single = terminal;

  const client = { from: () => builder } as unknown as SupabaseClient;
  return { client, calls };
}

describe("getApplicationForUser", () => {
  it("loads the existing draft for the given user", async () => {
    const { client, calls } = createFakeSupabase({ data: draft });

    const result = await getApplicationForUser(client, "user-123");

    expect(result).toEqual(draft);
    expect(calls.eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("returns null when the user has no application", async () => {
    const { client } = createFakeSupabase({ data: null });
    expect(await getApplicationForUser(client, "user-123")).toBeNull();
  });
});

describe("createApplicationDraft", () => {
  it("inserts a draft owned by the authenticated user with their profile's type", async () => {
    const { client, calls } = createFakeSupabase({ data: draft });

    await createApplicationDraft(client, "user-123", "hacker", { school: "UC Berkeley" });

    expect(calls.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      application_type: "hacker",
      status: "draft",
      responses: { school: "UC Berkeley" },
    });
  });
});

describe("updateApplicationDraft", () => {
  it("scopes the update to the caller's own draft and never touches user_id", async () => {
    const { client, calls } = createFakeSupabase({ data: draft });

    await updateApplicationDraft(client, "user-123", { school: "Stanford" });

    expect(calls.update).toHaveBeenCalledWith({ responses: { school: "Stanford" } });
    expect(calls.update.mock.calls[0][0]).not.toHaveProperty("submitted_at");
    expect(calls.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(calls.eq).toHaveBeenCalledWith("status", "draft");
  });

  it("reports an error when no draft matches (already submitted)", async () => {
    const { client } = createFakeSupabase({ data: null });

    await expect(
      updateApplicationDraft(client, "user-123", { school: "Stanford" }),
    ).rejects.toThrow(/already been submitted/);
  });
});

describe("submitApplication", () => {
  it("moves a draft to submitted and leaves submitted_at to the database", async () => {
    const { client, calls } = createFakeSupabase({
      data: { ...draft, status: "submitted", submitted_at: "2026-09-11T00:00:00Z" },
    });

    const result = await submitApplication(client, "user-123", draft.responses as never);

    // The update sends only the columns applicants are allowed to write.
    // submitted_at is stamped by a trigger, so sending it would be refused.
    expect(calls.update).toHaveBeenCalledWith({
      responses: draft.responses,
      status: "submitted",
    });
    expect(calls.eq).toHaveBeenCalledWith("status", "draft");
    expect(result.status).toBe("submitted");
    expect(result.submitted_at).toBe("2026-09-11T00:00:00Z");
  });

  it("surfaces database errors instead of swallowing them", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });

    await expect(submitApplication(client, "user-123", {})).rejects.toThrow(
      /row-level security/,
    );
  });
});
