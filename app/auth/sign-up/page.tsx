import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  DEFAULT_PUBLIC_ACCOUNT_TYPE,
  parsePublicAccountType,
} from "@/lib/account-types";

export const metadata: Metadata = { title: "Create account" };

type SignUpPageProps = {
  searchParams: Promise<{ type?: string }>;
};

/**
 * Reads the optional ?type= parameter from the landing page's role cards.
 * The value is untrusted input, so it is passed through the allowlist: an
 * unknown value (including "organizer") silently falls back to the default.
 * Reading searchParams is dynamic, hence the Suspense boundary in the page.
 */
async function SignUpFormWithPreselectedType({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const initialAccountType =
    parsePublicAccountType(params.type) ?? DEFAULT_PUBLIC_ACCOUNT_TYPE;

  return <SignUpForm initialAccountType={initialAccountType} />;
}

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return (
    <Suspense fallback={<SignUpForm />}>
      <SignUpFormWithPreselectedType searchParams={searchParams} />
    </Suspense>
  );
}
