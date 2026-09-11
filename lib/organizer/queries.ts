import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrganizerApplication } from "@/lib/applications/types";
import type { ReviewInput } from "@/lib/organizer/review";

/**
 * Organizer data access. Reads use the organizer_applications view and
 * writes use the review_application() function; both are SECURITY DEFINER
 * objects in the database that verify the caller is an organizer, so this
 * code never needs elevated keys.
 */

const ORGANIZER_COLUMNS =
  "id, application_type, responses, status, score, reviewer_notes, submitted_at, applicant_name";

export async function listApplicationsForOrganizer(
  supabase: SupabaseClient,
): Promise<OrganizerApplication[]> {
  const { data, error } = await supabase
    .from("organizer_applications")
    .select(ORGANIZER_COLUMNS)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Could not load applications: ${error.message}`);
  }

  return (data as OrganizerApplication[]) ?? [];
}

export async function getApplicationForOrganizer(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<OrganizerApplication | null> {
  const { data, error } = await supabase
    .from("organizer_applications")
    .select(ORGANIZER_COLUMNS)
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load application: ${error.message}`);
  }

  return (data as OrganizerApplication | null) ?? null;
}

export async function reviewApplication(
  supabase: SupabaseClient,
  applicationId: string,
  review: ReviewInput,
): Promise<void> {
  const { error } = await supabase.rpc("review_application", {
    application_id: applicationId,
    new_status: review.status,
    new_score: review.score,
    new_notes: review.notes,
  });

  if (error) {
    throw new Error(`Could not save review: ${error.message}`);
  }
}
