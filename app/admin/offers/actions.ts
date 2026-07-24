"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const offerSchema = z.object({
  venueId: z.string().min(1),
  title: z.string().trim().min(1),
  terms: z.string().trim().min(1),
  minPartySize: z.coerce.number().int().min(1),
  validDays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  validFromHour: z.coerce.number().int().min(0).max(23),
  validToHour: z.coerce.number().int().min(1).max(24),
  startsOn: z.coerce.date(),
  endsOn: z.string().optional(),
  isActive: z.boolean(),
});

function parseOfferForm(formData: FormData) {
  return offerSchema.safeParse({
    venueId: formData.get("venueId"),
    title: formData.get("title"),
    terms: formData.get("terms"),
    minPartySize: formData.get("minPartySize"),
    validDays: formData.getAll("validDays"),
    validFromHour: formData.get("validFromHour"),
    validToHour: formData.get("validToHour"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn") || undefined,
    isActive: formData.get("isActive") === "on",
  });
}

export type OfferActionState = { error?: string } | undefined;

export async function createOffer(_prevState: OfferActionState, formData: FormData): Promise<OfferActionState> {
  await requireAdmin();
  const parsed = parseOfferForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { endsOn, ...data } = parsed.data;

  const offer = await prisma.venueOffer.create({
    data: { ...data, endsOn: endsOn ? new Date(endsOn) : null },
  });
  revalidatePath("/admin/offers");
  redirect(`/admin/offers/${offer.id}`);
}

export async function updateOffer(
  offerId: string,
  _prevState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  await requireAdmin();
  const parsed = parseOfferForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { endsOn, ...data } = parsed.data;

  await prisma.venueOffer.update({
    where: { id: offerId },
    data: { ...data, endsOn: endsOn ? new Date(endsOn) : null },
  });
  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${offerId}`);
  return { error: undefined };
}
