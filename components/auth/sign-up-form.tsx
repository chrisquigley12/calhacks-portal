"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountTypeSelector } from "@/components/auth/account-type-selector";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DEFAULT_PUBLIC_ACCOUNT_TYPE } from "@/lib/account-types";
import type { ApplicationType } from "@/lib/application-types";
import { createClient } from "@/lib/supabase/client";

/** Where a signed-in applicant lands; also the confirmation email's target. */
const SIGNED_IN_PATH = "/dashboard";

/** Shown when the account exists but the email address still needs confirming. */
const CONFIRMATION_PENDING_PATH = "/auth/sign-up-success";

interface SignUpFormProps {
  /**
   * Preselected account type, already validated by the page against the
   * public allowlist. The user can still switch before submitting.
   */
  initialAccountType?: ApplicationType;
}

export function SignUpForm({
  initialAccountType = DEFAULT_PUBLIC_ACCOUNT_TYPE,
}: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<ApplicationType>(initialAccountType);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (fullName.trim() === "") {
      setError("Please enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    // The name and account type are stored as auth user metadata so they
    // survive the email-confirmation round trip. The profile row itself is
    // created on the first authenticated visit (see lib/profiles.ts), where
    // the account type is validated again server-side.
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${SIGNED_IN_PATH}`,
        data: {
          full_name: fullName.trim(),
          account_type: accountType,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    // Supabase decides what signUp() returns based on the project's "Confirm
    // email" setting. With confirmation on, there is no session yet and the
    // user must follow the emailed link; with it off, the user is signed in
    // immediately and can go straight to the dashboard, where the profile is
    // created from the same metadata on first visit. The session object is
    // the only thing consulted here — no environment flags, no shortcuts.
    router.push(data.session ? SIGNED_IN_PATH : CONFIRMATION_PENDING_PATH);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Create your account, then start your application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AccountTypeSelector value={accountType} onChange={setAccountType} />

          <FormField id="full-name" label="Full name">
            {(controlProps) => (
              <Input
                {...controlProps}
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            )}
          </FormField>

          <FormField id="email" label="Email">
            {(controlProps) => (
              <Input
                {...controlProps}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </FormField>

          <FormField id="password" label="Password">
            {(controlProps) => (
              <Input
                {...controlProps}
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </FormField>

          <FormField id="confirm-password" label="Confirm password">
            {(controlProps) => (
              <Input
                {...controlProps}
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            )}
          </FormField>

          <FormError message={error} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
