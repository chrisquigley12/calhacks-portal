import { PageContainer } from "@/components/layout/page-container";

export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <PageContainer className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Cal Hacks Portal</p>
        <p>Applications and review, in one place.</p>
      </PageContainer>
    </footer>
  );
}
