"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { createClient } from "@/lib/supabase/client";

/**
 * Which sign-in experience to show. This only changes copy and where the
 * browser is sent after a successful sign-in. It grants nothing: /organizer
 * verifies profiles.account_type on the server and bounces anyone else to
 * /dashboard, so an applicant using organizer mode ends up on their own
 * dashboard.
 */
export type LoginMode = "applicant" | "organizer";

/** Fixed allowlist of post-login destinations; never read from the URL. */
const DESTINATION_BY_MODE: Record<LoginMode, string> = {
  applicant: "/dashboard",
  organizer: "/organizer",
};

interface LoginFormProps {
  mode?: LoginMode;
}

export function LoginForm({ mode = "applicant" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.push(DESTINATION_BY_MODE[mode]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "organizer" ? "Organizer sign in" : "Sign in"}</CardTitle>
        <CardDescription>
          {mode === "organizer"
            ? "Sign in with your Cal Hacks organizer account."
            : "Use the email and password you signed up with."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </FormField>

          <FormError message={error} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
            <Link
              href="/auth/forgot-password"
              className="underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
            {mode === "organizer" ? (
              <p>Organizer accounts are provisioned by the Cal Hacks team.</p>
            ) : (
              <p>
                New here?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
