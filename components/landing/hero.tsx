import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b">
      <PageContainer className="flex flex-col items-start gap-6 py-24 sm:py-32">
        <p className="text-sm font-medium text-primary">Cal Hacks · Fall 2026</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Apply to Cal Hacks. Review every application in one place.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Hackers and volunteers apply in a few minutes. Organizers review,
          grade, and track each application from a single dashboard.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Start an application</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}
