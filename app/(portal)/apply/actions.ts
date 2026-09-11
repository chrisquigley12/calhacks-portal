"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isOrganizer } from "@/lib/account-types";
import {
  getFormDefinition,
  readAnswersFromFormData,
  validateAnswers,
} from "@/lib/applications/forms";
import {
  createApplicationDraft,
  getApplicationForUser,
  submitApplication,
  updateApplicationDraft,
} from "@/lib/applications/queries";
import type { SaveApplicationState } from "@/lib/applications/save-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles both "Save draft" and "Submit application" (chosen by the
 * `intent` field) so the security checks live in exactly one place.
 *
 * Nothing about *who* or *which form* comes from the browser: identity is
 * the verified session, and the form is chosen by profiles.account_type.
 * The browser only contributes answer values, which are validated here.
 */
export async function saveApplicationAction(
  _previousState: SaveApplicationState,
  formData: FormData,
): Promise<SaveApplicationState> {
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";

  const user = await requireCurrentUser();
  const supabase = await createClient();

  const profile = await getProfile(supabase, user.id);
  if (!profile || isOrganizer(profile.account_type)) {
    return failure("Only applicants can fill in an application.");
  }

  const form = getFormDefinition(profile.account_type);
  if (!form) {
    return failure("No application form is available for your account.");
  }

  const answers = readAnswersFromFormData(form, formData);
  const fieldErrors = validateAnswers(form, answers, intent);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const existing = await getApplicationForUser(supabase, user.id);

    if (intent === "submit") {
      if (!existing) {
        // Submitting straight from an empty form: create the draft first so
        // the submit path is always draft → submitted.
        await createApplicationDraft(supabase, user.id, form.applicantType, answers);
      }
      await submitApplication(supabase, user.id, answers);
    } else if (existing) {
      await updateApplicationDraft(supabase, user.id, answers);
    } else {
      await createApplicationDraft(supabase, user.id, form.applicantType, answers);
    }
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Something went wrong.");
  }

  revalidatePath("/apply");
  revalidatePath("/dashboard");

  if (intent === "submit") {
    redirect("/apply?submitted=1");
  }

  return { status: "saved", message: "Draft saved.", fieldErrors: {} };
}

function failure(message: string): SaveApplicationState {
  return { status: "error", message, fieldErrors: {} };
}
