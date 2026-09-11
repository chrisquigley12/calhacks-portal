import { BrandMark } from "@/components/layout/brand-mark";

/**
 * Minimal shell for sign-in, sign-up, and password pages: a centered column
 * with the wordmark for a way back home. No site navigation, so the form is
 * the only thing to focus on.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-6 py-12 sm:py-20">
      <div className="mb-8">
        <BrandMark />
      </div>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
