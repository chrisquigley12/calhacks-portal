import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, letting later classes override earlier ones
 * (for example `cn("px-4", className)` lets a caller replace the padding).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * True when the public Supabase environment variables are present.
 * The session-refresh proxy uses this to skip auth work in an unconfigured
 * environment (e.g. a fresh clone without .env.local) instead of crashing.
 */
export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
