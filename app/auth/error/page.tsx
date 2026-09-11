import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Something went wrong" };

type ErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

// Reading searchParams is dynamic, so it lives in its own component behind
// Suspense; the surrounding card can still be rendered statically.
async function ErrorDetails({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  return (
    <p className="text-sm text-muted-foreground">
      {params.error ? `Details: ${params.error}` : "An unspecified error occurred."}
    </p>
  );
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          We couldn&apos;t complete that request. Try again, or sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Suspense>
          <ErrorDetails searchParams={searchParams} />
        </Suspense>
        <Button asChild variant="outline">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
