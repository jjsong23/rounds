import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./_profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dateOfBirth: true, displayName: true, avatarUrl: true, name: true, image: true },
  });
  if (!user) redirect("/sign-in");
  if (!user.dateOfBirth) redirect("/onboarding/age");

  return (
    <ProfileForm
      initialDisplayName={user.displayName ?? user.name ?? ""}
      initialAvatarUrl={user.avatarUrl ?? user.image ?? ""}
    />
  );
}
