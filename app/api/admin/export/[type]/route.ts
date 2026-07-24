import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { matchesOffer } from "@/lib/offers";

async function requireAdminApi() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.isAdmin ? user : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { type } = await params;
  let csv: string;

  switch (type) {
    case "users": {
      const users = await prisma.user.findMany();
      csv = toCsv(users, ["id", "email", "displayName", "city", "isAdmin", "createdAt"]);
      break;
    }
    case "venues": {
      const venues = await prisma.venue.findMany();
      csv = toCsv(venues, ["id", "name", "slug", "city", "venueType", "noiseLevel", "outreachStatus", "contactName", "contactEmail"]);
      break;
    }
    case "groups": {
      const groups = await prisma.group.findMany();
      csv = toCsv(groups, ["id", "name", "slug", "city", "kind", "status", "createdByUserId", "lastRoundAt", "createdAt"]);
      break;
    }
    case "rounds": {
      const rounds = await prisma.round.findMany();
      csv = toCsv(rounds, ["id", "groupId", "hostId", "venueId", "locationText", "title", "startsAt", "capacity", "status", "createdAt"]);
      break;
    }
    case "tags": {
      const tags = await prisma.tag.findMany();
      csv = toCsv(tags, ["id", "slug", "label", "isActive"]);
      break;
    }
    case "attendance": {
      const attendance = await prisma.attendance.findMany();
      csv = toCsv(attendance, ["id", "roundId", "userId", "confirmedByUserId", "confirmedAt"]);
      break;
    }
    case "offer-matches": {
      const offers = await prisma.venueOffer.findMany();
      const rounds = await prisma.round.findMany({ where: { venueId: { not: null } } });
      const rows: Record<string, unknown>[] = [];
      for (const offer of offers) {
        for (const round of rounds) {
          if (round.venueId !== offer.venueId) continue;
          if (matchesOffer({ venueId: round.venueId!, startsAt: round.startsAt, partySize: round.capacity }, offer)) {
            rows.push({ offerId: offer.id, offerTitle: offer.title, roundId: round.id, roundTitle: round.title, startsAt: round.startsAt.toISOString() });
          }
        }
      }
      csv = toCsv(rows, ["offerId", "offerTitle", "roundId", "roundTitle", "startsAt"]);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
