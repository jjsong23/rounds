import type { VenueOffer } from "@/generated/prisma/client";

export function isOfferCurrentlyActive(
  offer: Pick<VenueOffer, "isActive" | "startsOn" | "endsOn">,
  at: Date = new Date(),
): boolean {
  if (!offer.isActive) return false;
  if (offer.startsOn > at) return false;
  if (offer.endsOn && offer.endsOn < at) return false;
  return true;
}

export const VENUE_TYPE_LABELS: Record<string, string> = {
  BREWERY: "Brewery",
  TAPROOM: "Taproom",
  BEER_GARDEN: "Beer Garden",
  BREWPUB: "Brewpub",
  WINE_BAR: "Wine Bar",
  TASTING_ROOM: "Tasting Room",
  BOTTLE_SHOP: "Bottle Shop",
};

export const NOISE_LEVEL_LABELS: Record<string, string> = {
  QUIET: "Quiet",
  MODERATE: "Moderate",
  LOUD: "Loud",
};
