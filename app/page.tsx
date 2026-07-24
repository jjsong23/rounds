import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">Rounds</h1>
        <p className="text-lg text-foreground/70">
          New to a city or a job? Find people to grab a pint with — a specific group, at a specific taproom or
          wine bar, at a specific time. No swiping, no matching.
        </p>
        <Link
          href="/sign-in"
          className="inline-block rounded-lg bg-amber px-6 py-3 font-medium text-paper transition hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
