import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getVisibleLastCall } from "@/lib/last-call";
import { RespondButtons } from "./_respond-buttons";

export default async function LastCallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const lastCall = await getVisibleLastCall(id, user.id);
  if (!lastCall) notFound();

  const isPoster = lastCall.userId === user.id;
  const myResponse = lastCall.responses.find((r) => r.userId === user.id);

  return (
    <div className="space-y-6">
      <Link href="/last-call" className="text-sm text-foreground/60 hover:underline">
        ← Last Call
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{lastCall.venue?.name ?? lastCall.locationText}</h1>
        <p className="text-sm text-foreground/60">
          {isPoster ? "You" : lastCall.user.displayName} · expires{" "}
          {lastCall.expiresAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
        {lastCall.message && <p className="mt-2 text-foreground/80">{lastCall.message}</p>}
      </div>

      {!isPoster && (
        <div>
          <p className="mb-2 text-sm font-medium">Are you coming?</p>
          <RespondButtons id={lastCall.id} currentStatus={myResponse?.status ?? null} />
        </div>
      )}

      {isPoster && (
        <div>
          <h2 className="text-lg font-semibold">Responses</h2>
          {lastCall.responses.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/60">No responses yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lastCall.responses.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  {r.user.displayName}
                  <span className="text-xs text-foreground/60">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
