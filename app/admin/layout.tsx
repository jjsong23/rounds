import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/rounds/new", label: "New round" },
  { href: "/admin/export", label: "Export" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="border-b border-black/20 bg-neutral-50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-2 text-sm">
          <span className="font-bold">Rounds Admin</span>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="underline">
              {l.label}
            </Link>
          ))}
          <Link href="/feed" className="ml-auto underline">
            Exit admin
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
