import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm, type LoginMode } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

type LoginPageProps = {
  searchParams: Promise<{ role?: string }>;
};

/**
 * ?role=organizer switches the copy and post-login destination only. It is
 * not an authorization signal — see LoginForm and requireOrganizer().
 */
async function LoginFormForRole({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode: LoginMode = params.role === "organizer" ? "organizer" : "applicant";
  return <LoginForm mode={mode} />;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginFormForRole searchParams={searchParams} />
    </Suspense>
  );
}
