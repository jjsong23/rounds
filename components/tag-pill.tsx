import Link from "next/link";

// Deliberately one quiet style for every tag, with no per-tag color coding.
// At 16+ tags, color-per-identity turns into a bag of pills; color is
// reserved for *state* (selected/followed) instead, via the `active` prop.
export function TagPill({
  children,
  href,
  active,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const classes = `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
      : "border-border bg-transparent text-ink/70 hover:border-ink/40 dark:text-paper/70 dark:hover:border-paper/40"
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return <span className={classes}>{children}</span>;
}
