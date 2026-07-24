import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Venues</h1>
        <Link href="/admin/venues/new" className="underline">
          + New venue
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="py-1 pr-2">Name</th>
            <th className="py-1 pr-2">City</th>
            <th className="py-1 pr-2">Type</th>
            <th className="py-1 pr-2">Outreach status</th>
            <th className="py-1 pr-2">Contact</th>
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} className="border-b border-black/10">
              <td className="py-1 pr-2">
                <Link href={`/admin/venues/${v.id}`} className="underline">
                  {v.name}
                </Link>
              </td>
              <td className="py-1 pr-2">{v.city}</td>
              <td className="py-1 pr-2">{v.venueType}</td>
              <td className="py-1 pr-2">{v.outreachStatus}</td>
              <td className="py-1 pr-2">
                {v.contactName ?? "—"} {v.contactEmail ? `(${v.contactEmail})` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
