/** What the review form receives back after a save attempt. */
export interface ReviewFormState {
  status: "idle" | "saved" | "error";
  message: string | null;
  fieldErrors: Record<string, string>;
}

export const INITIAL_REVIEW_STATE: ReviewFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
