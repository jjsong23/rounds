import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TagsForm } from "./_tags-form";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user, tags, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dateOfBirth: true, displayName: true },
    }),
    prisma.tag.findMany({ where: { isActive: true }, orderBy: { label: "asc" } }),
    prisma.tagFollow.findMany({ where: { userId: session.user.id } }),
  ]);
  if (!user) redirect("/sign-in");
  if (!user.dateOfBirth) redirect("/onboarding/age");
  if (!user.displayName) redirect("/onboarding/profile");

  const initialTagIds = new Set(existing.map((f) => f.tagId));

  return <TagsForm tags={tags} initialTagIds={initialTagIds} />;
}
