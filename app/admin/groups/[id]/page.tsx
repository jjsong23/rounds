import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GroupForm } from "../_group-form";
import { adminUpdateGroup } from "../actions";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) notFound();

  const action = adminUpdateGroup.bind(null, group.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{group.name}</h1>
      <GroupForm action={action} initial={group} />
    </div>
  );
}
