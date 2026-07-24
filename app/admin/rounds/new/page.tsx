import { prisma } from "@/lib/prisma";
import { AdminRoundForm } from "./_admin-round-form";

export default async function AdminNewRoundPage() {
  const [users, groups, venues] = await Promise.all([
    prisma.user.findMany({ orderBy: { displayName: "asc" } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
    prisma.venue.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Create a round on behalf of a user</h1>
      <p className="text-sm text-neutral-600">
        Useful for seeding a group&apos;s calendar before it has real hosts.
      </p>
      <AdminRoundForm users={users} groups={groups} venues={venues} />
    </div>
  );
}
