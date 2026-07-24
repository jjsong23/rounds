import { cache } from "react";
import { auth } from "@/auth";
import { getUserForSession } from "@/lib/user-session";

export { getUserForSession } from "@/lib/user-session";

// Single query, cached per request: session -> full user with the
// relations most pages need (group memberships, followed tags, drink
// preferences).
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getUserForSession(session.user.id);
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function isOnboarded(user: Pick<CurrentUser, "dateOfBirth" | "displayName">): boolean {
  return Boolean(user.dateOfBirth && user.displayName);
}
