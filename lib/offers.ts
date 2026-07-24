import type { VenueOffer } from "@/generated/prisma/client";
import { isOfferCurrentlyActive } from "@/lib/venues";

export function matchesOffer(
  input: { venueId: string; startsAt: Date; partySize: number },
  offer: VenueOffer,
): boolean {
  if (input.venueId !== offer.venueId) return false;
  if (!isOfferCurrentlyActive(offer, input.startsAt)) return false;
  if (input.partySize < offer.minPartySize) return false;

  const validDays = Array.isArray(offer.validDays) ? (offer.validDays as number[]) : [];
  if (!validDays.includes(input.startsAt.getDay())) return false;

  const hour = input.startsAt.getHours();
  if (hour < offer.validFromHour || hour >= offer.validToHour) return false;

  return true;
}

export function describeOfferMatch(offer: VenueOffer, partySize: number): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const validDays = Array.isArray(offer.validDays) ? (offer.validDays as number[]) : [];
  const days = validDays.map((d) => dayNames[d]).join("/");
  return `${partySize}+ people on ${days} — ${offer.title.toLowerCase()}`;
}
