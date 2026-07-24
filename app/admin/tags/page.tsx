import { prisma } from "@/lib/prisma";
import { now } from "@/lib/datetime";
import { TagRowControls } from "./_tag-row-controls";
import { NewTagForm } from "./_new-tag-form";

export default async function AdminTagsPage() {
  const since = new Date(now().getTime() - 90 * 24 * 60 * 60 * 1000);

  const tags = await prisma.tag.findMany({
    include: {
      roundTags: {
        where: { round: { createdAt: { gte: since } } },
        include: { round: { include: { rsvps: { where: { status: { in: ["GOING", "WAITLIST"] } } } } } },
      },
    },
    orderBy: { label: "asc" },
  });

  const rows = tags.map((tag) => ({
    tag,
    usageCount: tag.roundTags.length,
    rsvpTotal: tag.roundTags.reduce((sum, rt) => sum + rt.round.rsvps.length, 0),
  }));
  rows.sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tags</h1>
      <NewTagForm />

      <div>
        <h2 className="font-bold">Demand report (last 90 days)</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left">
              <th className="py-1 pr-2">Tag</th>
              <th className="py-1 pr-2">Active</th>
              <th className="py-1 pr-2">Rounds tagged</th>
              <th className="py-1 pr-2">Total RSVPs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ tag, usageCount, rsvpTotal }) => (
              <tr key={tag.id} className="border-b border-black/10">
                <td className="py-1 pr-2">
                  <TagRowControls tagId={tag.id} label={tag.label} isActive={tag.isActive} />
                </td>
                <td className="py-1 pr-2">{tag.isActive ? "Yes" : "No"}</td>
                <td className="py-1 pr-2">{usageCount}</td>
                <td className="py-1 pr-2">{rsvpTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
