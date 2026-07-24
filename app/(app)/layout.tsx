import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Onboarding completeness gate. Deliberately re-reads from the DB rather
  // than trusting anything cached on the session/JWT.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dateOfBirth: true, displayName: true },
  });
  if (!user) redirect("/sign-in");
  if (!user.dateOfBirth) redirect("/onboarding/age");
  if (!user.displayName) redirect("/onboarding/profile");

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
