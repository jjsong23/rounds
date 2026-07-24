import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isAttendanceEditable } from "@/lib/attendance";
import { now } from "@/lib/datetime";
import { AttendanceForm } from "./_attendance-form";

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      rsvps: { where: { status: "GOING" }, include: { user: true } },
      attendances: true,
    },
  });
  if (!round) notFound();

  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: round.groupId } },
  });
  const isAuthorized = round.hostId === user.id || membership?.role === "ADMIN";
  if (!isAuthorized) {
    return (
      <p className="text-sm text-foreground/60">
        Only the host or a group admin can confirm attendance for this round.
      </p>
    );
  }

  if (round.startsAt.getTime() > now().getTime()) {
    return (
      <p className="text-sm text-foreground/60">
        Attendance can be confirmed once this round has started —{" "}
        <Link href={`/rounds/${round.id}`} className="underline underline-offset-4">
          back to the round
        </Link>
        .
      </p>
    );
  }

  const editable = isAttendanceEditable(round);
  const confirmedIds = new Set(round.attendances.map((a) => a.userId));

  const attendees = round.rsvps.map((r) => ({
    userId: r.userId,
    displayName: r.user.displayName ?? "",
    checked: confirmedIds.has(r.userId),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rounds/${round.id}`} className="text-sm text-foreground/60 hover:underline">
          ← {round.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Confirm attendance</h1>
        <p className="text-sm text-foreground/60">
          Check off who actually showed up. This builds each attendee&rsquo;s warm graph — the people they
          can reach with Last Call.
        </p>
      </div>

      {!editable ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground/60">
          The 7-day edit window for this round has closed.
        </p>
      ) : attendees.length === 0 ? (
        <p className="text-sm text-foreground/60">Nobody RSVPed GOING to this round.</p>
      ) : (
        <AttendanceForm roundId={round.id} attendees={attendees} />
      )}
    </div>
  );
}
