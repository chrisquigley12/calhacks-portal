import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  getApplicationForOrganizer,
  listApplicationsForOrganizer,
  reviewApplication,
} from "@/lib/organizer/queries";

function createFakeSupabase(reply: { data: unknown; error?: { message: string } | null }) {
  const from = vi.fn();
  const rpc = vi.fn(async () => ({ data: null, error: reply.error ?? null }));
  const terminal = async () => ({ data: reply.data, error: reply.error ?? null });

  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.order = terminal;
  builder.maybeSingle = terminal;

  const client = {
    from: (table: string) => {
      from(table);
      return builder;
    },
    rpc,
  } as unknown as SupabaseClient;

  return { client, from, rpc };
}

describe("organizer queries", () => {
  it("lists and reads through the organizer_applications view, not the raw table", async () => {
    const { client, from } = createFakeSupabase({ data: [] });

    await listApplicationsForOrganizer(client);
    await getApplicationForOrganizer(client, "app-1");

    expect(from).toHaveBeenCalledTimes(2);
    expect(from).toHaveBeenCalledWith("organizer_applications");
    expect(from).not.toHaveBeenCalledWith("applications");
  });

  it("saves a review through the review_application database function", async () => {
    const { client, rpc } = createFakeSupabase({ data: null });

    await reviewApplication(client, "app-1", { status: "accepted", score: 9, notes: "Yes" });

    expect(rpc).toHaveBeenCalledWith("review_application", {
      application_id: "app-1",
      new_status: "accepted",
      new_score: 9,
      new_notes: "Yes",
    });
  });

  it("surfaces a database refusal (e.g. caller is not an organizer)", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "Only organizers can review applications" },
    });

    await expect(
      reviewApplication(client, "app-1", { status: "reviewed", score: null, notes: "" }),
    ).rejects.toThrow(/Only organizers/);
  });
});
