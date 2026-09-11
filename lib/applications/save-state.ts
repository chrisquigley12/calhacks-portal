import type { FieldErrors } from "@/lib/applications/forms";

/** What the application form receives back after a save or submit attempt. */
export interface SaveApplicationState {
  status: "idle" | "saved" | "error";
  message: string | null;
  fieldErrors: FieldErrors;
}

export const INITIAL_SAVE_STATE: SaveApplicationState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
