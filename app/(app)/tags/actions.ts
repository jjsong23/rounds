"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleTagFollow(tagId: string, tagSlug: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");

  const existing = await prisma.tagFollow.findUnique({ where: { userId_tagId: { userId, tagId } } });
  if (existing) {
    await prisma.tagFollow.delete({ where: { userId_tagId: { userId, tagId } } });
  } else {
    await prisma.tagFollow.create({ data: { userId, tagId } });
  }

  revalidatePath(`/tags/${tagSlug}`);
}
