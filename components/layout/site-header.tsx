import { Suspense } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { HeaderAuthActions } from "@/components/layout/header-auth-actions";
import { PageContainer } from "@/components/layout/page-container";

/**
 * Top navigation bar shared by every portal page.
 *
 * The right-hand side depends on the signed-in user, which requires reading
 * cookies on the server. That part is isolated in HeaderAuthActions and
 * wrapped in Suspense so the rest of the header (and page) can render as
 * static HTML while the auth state streams in.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <PageContainer className="flex h-14 items-center justify-between">
        <BrandMark />
        <Suspense fallback={<div className="h-9 w-32" aria-hidden="true" />}>
          <HeaderAuthActions />
        </Suspense>
      </PageContainer>
    </header>
  );
}
