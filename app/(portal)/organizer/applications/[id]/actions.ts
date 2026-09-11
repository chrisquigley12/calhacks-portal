"use server";

import { revalidatePath } from "next/cache";

import { requireOrganizer } from "@/lib/auth/require-organizer";
import { reviewApplication } from "@/lib/organizer/queries";
import { parseReviewInput } from "@/lib/organizer/review";
import type { ReviewFormState } from "@/lib/organizer/review-state";
import { createClient } from "@/lib/supabase/server";

/**
 * Saves an organizer's status, score, and notes for one application. The
 * organizer role is checked here and again inside the database function.
 */
export async function reviewApplicationAction(
  applicationId: string,
  _previousState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireOrganizer();

  const { input, errors } = parseReviewInput(formData);
  if (!input) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: errors };
  }

  try {
    const supabase = await createClient();
    await reviewApplication(supabase, applicationId, input);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
      fieldErrors: {},
    };
  }

  // The applicant's pages show the public status, so refresh those too.
  revalidatePath("/organizer");
  revalidatePath(`/organizer/applications/${applicationId}`);
  revalidatePath("/dashboard");
  revalidatePath("/apply");

  return { status: "saved", message: "Review saved.", fieldErrors: {} };
}
