import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getGroupCreationProgress } from "@/lib/unlocks";
import { CreateGroupForm } from "./_create-group-form";

export default async function NewGroupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const progress = await getGroupCreationProgress(user.id);

  if (progress.groupsCreated >= progress.groupCap) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <h1 className="text-xl font-semibold">You&rsquo;ve hit the group cap</h1>
        <p className="mt-2 text-sm text-foreground/60">
          You&rsquo;ve created {progress.groupsCreated} of {progress.groupCap} groups allowed per person.
        </p>
      </div>
    );
  }

  if (!progress.unlocked) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <h1 className="text-xl font-semibold">Creating a group is earned</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Host {progress.requiredRounds} rounds that each reach 4 or more confirmed attendees, and
          you&rsquo;ll unlock it.
        </p>
        <p className="mt-3 text-2xl font-semibold">
          {progress.qualifyingRoundsHosted} of {progress.requiredRounds}
        </p>
        <p className="text-xs text-foreground/60">qualifying rounds hosted</p>
      </div>
    );
  }

  return <CreateGroupForm />;
}
