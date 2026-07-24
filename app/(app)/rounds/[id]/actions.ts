"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { performRsvp, performCancelRsvp } from "@/lib/rsvp";
import { matchesOffer, describeOfferMatch } from "@/lib/offers";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return userId;
}

export type RsvpState = { error?: string; confirmation?: string } | undefined;

export async function rsvpToRound(_prevState: RsvpState, formData: FormData): Promise<RsvpState> {
  const userId = await requireUserId();
  const roundId = String(formData.get("roundId") ?? "");

  const outcome = await performRsvp(prisma, roundId, userId);
  revalidatePath(`/rounds/${roundId}`);

  if (outcome.error) return { error: outcome.error };
  if (outcome.status === "WAITLIST") {
    return { confirmation: "You're on the waitlist — we'll bump you up if a spot opens." };
  }

  const round = await prisma.round.findUnique({ where: { id: roundId }, include: { venue: { include: { offers: true } } } });
  if (round?.venue) {
    const offerMatch = round.venue.offers.find((offer) =>
      matchesOffer({ venueId: round.venue!.id, startsAt: round.startsAt, partySize: round.capacity }, offer),
    );
    if (offerMatch) {
      return {
        confirmation: `You're in. ${describeOfferMatch(offerMatch, round.capacity)} — mention your group at the bar.`,
      };
    }
  }

  return { confirmation: "You're in." };
}

export async function cancelRsvp(_prevState: RsvpState, formData: FormData): Promise<RsvpState> {
  const userId = await requireUserId();
  const roundId = String(formData.get("roundId") ?? "");

  const outcome = await performCancelRsvp(prisma, roundId, userId);
  revalidatePath(`/rounds/${roundId}`);

  if (outcome.error) return { error: outcome.error };
  return { confirmation: "You're out." };
}

export async function cancelRound(roundId: string) {
  const userId = await requireUserId();

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("Round not found.");
  if (round.hostId !== userId) throw new Error("Only the host can cancel this round.");

  await prisma.$transaction([
    prisma.round.update({ where: { id: roundId }, data: { status: "CANCELLED" } }),
    prisma.rsvp.updateMany({
      where: { roundId, status: { in: ["GOING", "WAITLIST"] } },
      data: { status: "CANCELLED" },
    }),
  ]);

  revalidatePath(`/rounds/${roundId}`);
}
