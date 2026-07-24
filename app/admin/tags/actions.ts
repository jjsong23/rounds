"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type TagActionState = { error?: string } | undefined;

const createSchema = z.object({ label: z.string().trim().min(1).max(60) });

export async function createTag(_prevState: TagActionState, formData: FormData): Promise<TagActionState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { error: "Give the tag a label." };

  const slug = slugify(parsed.data.label);
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) return { error: "A tag with that slug already exists." };

  await prisma.tag.create({ data: { slug, label: parsed.data.label, isActive: true } });
  revalidatePath("/admin/tags");
  return { error: undefined };
}

export async function renameTag(tagId: string, label: string) {
  await requireAdmin();
  await prisma.tag.update({ where: { id: tagId }, data: { label } });
  revalidatePath("/admin/tags");
}

export async function setTagActive(tagId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.tag.update({ where: { id: tagId }, data: { isActive } });
  revalidatePath("/admin/tags");
}
