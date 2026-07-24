import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { SubmitButton } from "@/components/submit-button";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Sign in to Rounds</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Find people to grab a pint with. No passwords, no swiping.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-border px-4 py-2.5 font-medium transition hover:bg-ink/5 dark:hover:bg-paper/5"
          >
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs uppercase text-foreground/50">
          <div className="h-px flex-1 bg-ink/10 dark:bg-paper/10" />
          or
          <div className="h-px flex-1 bg-ink/10 dark:bg-paper/10" />
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("email", {
              email: formData.get("email"),
              redirectTo: "/",
            });
          }}
          className="space-y-3"
        >
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
          />
          <SubmitButton>Send magic link</SubmitButton>
        </form>

        <p className="text-center text-xs text-foreground/60">
          Rounds is for ages 21 and up. We&rsquo;ll ask you to confirm your date of birth next.
        </p>
      </div>
    </main>
  );
}
