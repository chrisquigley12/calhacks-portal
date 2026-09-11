import Link from "next/link";

import { CalHacksHeroVisual } from "@/components/landing/hero-visual";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <PageContainer className="flex flex-col gap-6 py-24 sm:py-32 lg:grid lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center lg:gap-x-8 lg:py-28 xl:gap-x-12">
        <div className="flex flex-col items-start gap-6">
          <p className="text-sm font-medium text-primary">
            Cal Hacks · Fall 2026
          </p>
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
        </div>

        {/*
          Desktop: the visual owns the right column and is allowed to bleed
          past the container's edge into the viewport's whitespace, so the
          composition reads as a full two-column hero rather than a boxed
          illustration. Mobile: a simplified version sits beneath the CTA.
        */}
        <div className="hidden lg:block lg:-my-24 lg:-mr-4 xl:-ml-6 xl:-mr-48 2xl:-mr-60">
          <CalHacksHeroVisual variant="full" />
        </div>
        <div className="-mx-6 mt-4 lg:hidden sm:mx-auto sm:w-full sm:max-w-md">
          <CalHacksHeroVisual variant="compact" />
        </div>
      </PageContainer>
    </section>
  );
}
