import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApplicationType } from "@/lib/application-types";
import type { AnswerValues } from "@/lib/applications/forms";
import type { Application } from "@/lib/applications/types";

/**
 * Data access for public.applications.
 *
 * Every function takes the caller's user id from server code that derived
 * it from the verified session — never from a form or request body. RLS
 * enforces the same ownership rules in the database, so these checks are
 * belt-and-braces rather than the only line of defense.
 */

const APPLICATION_COLUMNS =
  "id, user_id, application_type, status, responses, created_at, updated_at, submitted_at";

export async function getApplicationForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load application: ${error.message}`);
  }

  return (data as Application | null) ?? null;
}

export async function createApplicationDraft(
  supabase: SupabaseClient,
  userId: string,
  applicantType: ApplicationType,
  answers: AnswerValues,
): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      application_type: applicantType,
      status: "draft",
      responses: answers,
    })
    .select(APPLICATION_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Could not create application: ${error.message}`);
  }

  return data as Application;
}

export async function updateApplicationDraft(
  supabase: SupabaseClient,
  userId: string,
  answers: AnswerValues,
): Promise<Application> {
  return updateDraft(supabase, userId, { responses: answers });
}

export async function submitApplication(
  supabase: SupabaseClient,
  userId: string,
  answers: AnswerValues,
): Promise<Application> {
  // submitted_at is stamped by a database trigger on this transition; the
  // application never sets it (and has no column privilege to).
  return updateDraft(supabase, userId, {
    responses: answers,
    status: "submitted",
  });
}

/**
 * Shared by save-draft and submit. The `status = 'draft'` filter means a
 * submitted application matches zero rows, which we report as an error
 * instead of silently doing nothing. We deliberately use update rather than
 * upsert so a write can never create a row under the wrong conditions.
 */
async function updateDraft(
  supabase: SupabaseClient,
  userId: string,
  changes: Partial<Pick<Application, "responses" | "status">>,
): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .update(changes)
    .eq("user_id", userId)
    .eq("status", "draft")
    .select(APPLICATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not update application: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "This application has already been submitted and can no longer be edited.",
    );
  }

  return data as Application;
}
