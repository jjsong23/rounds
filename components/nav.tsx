"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(app)/actions";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/venues", label: "Venues" },
  { href: "/groups", label: "Groups" },
  { href: "/last-call", label: "Last Call" },
  { href: "/people", label: "People" },
  { href: "/me", label: "Me" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-paper/90 backdrop-blur dark:bg-ink/90">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 overflow-x-auto px-4 py-3">
        <Link href="/feed" className="shrink-0 font-semibold">
          Rounds
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname.startsWith(link.href)
                  ? "font-medium text-ink dark:text-paper"
                  : "text-foreground/60 hover:text-ink dark:hover:text-paper"
              }
            >
              {link.label}
            </Link>
          ))}
          <form action={signOutAction}>
            <button type="submit" className="text-foreground/60 hover:text-ink dark:hover:text-paper">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
