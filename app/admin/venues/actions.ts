"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const venueSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  venueType: z.enum(["BREWERY", "TAPROOM", "BEER_GARDEN", "BREWPUB", "WINE_BAR", "TASTING_ROOM", "BOTTLE_SHOP"]),
  noiseLevel: z.enum(["QUIET", "MODERATE", "LOUD"]),
  hasFlights: z.boolean(),
  hasCommunalTables: z.boolean(),
  hasOutdoorSeating: z.boolean(),
  isDogFriendly: z.boolean(),
  hasFood: z.boolean(),
  acceptsLargeGroups: z.boolean(),
  typicalPourPrice: z.coerce.number().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  outreachStatus: z.enum(["PROSPECT", "CONTACTED", "PARTNERED", "DECLINED"]),
  outreachNotes: z.string().trim().optional(),
});

function parseVenueForm(formData: FormData) {
  return venueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    venueType: formData.get("venueType"),
    noiseLevel: formData.get("noiseLevel"),
    hasFlights: formData.get("hasFlights") === "on",
    hasCommunalTables: formData.get("hasCommunalTables") === "on",
    hasOutdoorSeating: formData.get("hasOutdoorSeating") === "on",
    isDogFriendly: formData.get("isDogFriendly") === "on",
    hasFood: formData.get("hasFood") === "on",
    acceptsLargeGroups: formData.get("acceptsLargeGroups") === "on",
    typicalPourPrice: formData.get("typicalPourPrice") || undefined,
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    notes: formData.get("notes") || undefined,
    outreachStatus: formData.get("outreachStatus") || "PROSPECT",
    outreachNotes: formData.get("outreachNotes") || undefined,
  });
}

export type VenueActionState = { error?: string } | undefined;

export async function createVenue(_prevState: VenueActionState, formData: FormData): Promise<VenueActionState> {
  await requireAdmin();
  const parsed = parseVenueForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  let slug = slugify(parsed.data.name);
  const existing = await prisma.venue.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const venue = await prisma.venue.create({ data: { ...parsed.data, slug } });
  revalidatePath("/admin/venues");
  redirect(`/admin/venues/${venue.id}`);
}

export async function updateVenue(
  venueId: string,
  _prevState: VenueActionState,
  formData: FormData,
): Promise<VenueActionState> {
  await requireAdmin();
  const parsed = parseVenueForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  await prisma.venue.update({ where: { id: venueId }, data: parsed.data });
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueId}`);
  return { error: undefined };
}
