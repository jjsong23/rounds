import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminGroupsPage() {
  const groups = await prisma.group.findMany({
    include: { _count: { select: { memberships: true } }, createdBy: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Groups</h1>
        <Link href="/admin/groups/new" className="underline">
          + New group
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="py-1 pr-2">Name</th>
            <th className="py-1 pr-2">City</th>
            <th className="py-1 pr-2">Status</th>
            <th className="py-1 pr-2">Members</th>
            <th className="py-1 pr-2">Created by</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id} className="border-b border-black/10">
              <td className="py-1 pr-2">
                <Link href={`/admin/groups/${g.id}`} className="underline">
                  {g.name}
                </Link>
              </td>
              <td className="py-1 pr-2">{g.city}</td>
              <td className="py-1 pr-2">{g.status}</td>
              <td className="py-1 pr-2">{g._count.memberships}</td>
              <td className="py-1 pr-2">{g.createdBy?.displayName ?? "admin-seeded"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
