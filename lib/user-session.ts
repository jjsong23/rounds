import { prisma } from "@/lib/prisma";
import { isOfAge } from "@/lib/age";

// The DB-fetch + age re-verification, kept free of any Auth.js import so it
// can be exercised directly in tests without a Next.js request context
// (auth() needs real cookies, and next-auth's module graph doesn't resolve
// under plain Node/Vitest). Given a userId, it re-derives age from the
// stored dateOfBirth on every call — never trusts a cached session claim.
export async function getUserForSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      groupMemberships: { include: { group: true } },
      tagFollows: { include: { tag: true } },
      drinkPreferences: true,
    },
  });

  if (!user) return null;
  if (user.dateOfBirth && !isOfAge(user.dateOfBirth)) return null;

  return user;
}
