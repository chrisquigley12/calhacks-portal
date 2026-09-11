import Link from "next/link";

/**
 * The portal's wordmark. Rendered as a link home so it doubles as navigation.
 */
export function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
    >
      <span
        aria-hidden="true"
        className="inline-block size-2.5 rounded-sm bg-primary"
      />
      Cal Hacks Portal
    </Link>
  );
}
