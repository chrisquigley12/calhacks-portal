import type { Metadata } from "next";

import "./globals.css";

const siteUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cal Hacks Portal",
    template: "%s · Cal Hacks Portal",
  },
  description:
    "Apply to Cal Hacks as a hacker or volunteer, and review applications as an organizer.",
};

/**
 * Root layout: global styles only. Page chrome (header, footer) lives in
 * route-group layouts so the portal pages and the auth pages can have
 * different shells.
 *
 * Typography uses the system font stack (see tailwind.config.ts) rather than
 * a downloaded web font: it looks native on every platform, needs no network
 * request at build or run time, and avoids font-swap layout shift.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
