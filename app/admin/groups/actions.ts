"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify, isReservedSlug } from "@/lib/slug";

const groupSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().min(1),
  city: z.string().trim().min(1),
  kind: z.enum(["INDUSTRY", "SOCIAL", "ACTIVITY"]),
  status: z.enum(["ACTIVE", "DORMANT"]),
});

export type GroupActionState = { error?: string } | undefined;

// Admin-seeded groups: no unlock check, no membership auto-created — this
// is the ops console creating a group on the platform's behalf, not a user
// earning it.
export async function adminCreateGroup(_prevState: GroupActionState, formData: FormData): Promise<GroupActionState> {
  await requireAdmin();

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    city: formData.get("city"),
    kind: formData.get("kind"),
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const slug = slugify(parsed.data.slug);
  if (!slug || isReservedSlug(slug)) return { error: "That slug isn't available." };
  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing) return { error: "That slug is already taken." };

  const group = await prisma.group.create({
    data: { ...parsed.data, slug, createdByUserId: null },
  });
  revalidatePath("/admin/groups");
  redirect(`/admin/groups/${group.id}`);
}

export async function adminUpdateGroup(
  groupId: string,
  _prevState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  await requireAdmin();

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    city: formData.get("city"),
    kind: formData.get("kind"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const slug = slugify(parsed.data.slug);
  if (!slug || isReservedSlug(slug)) return { error: "That slug isn't available." };
  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing && existing.id !== groupId) return { error: "That slug is already taken." };

  await prisma.group.update({ where: { id: groupId }, data: { ...parsed.data, slug } });
  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${groupId}`);
  return { error: undefined };
}
