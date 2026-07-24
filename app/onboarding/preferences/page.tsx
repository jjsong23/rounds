import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "./_preferences-form";

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dateOfBirth: true, displayName: true },
    }),
    prisma.drinkPreference.findMany({ where: { userId: session.user.id } }),
  ]);
  if (!user) redirect("/sign-in");
  if (!user.dateOfBirth) redirect("/onboarding/age");
  if (!user.displayName) redirect("/onboarding/profile");

  const initialValues = new Set(existing.map((p) => `${p.kind}:${p.value}`));

  return <PreferencesForm initialValues={initialValues} />;
}
