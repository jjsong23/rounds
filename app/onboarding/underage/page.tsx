import Link from "next/link";

export default function UnderagePage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Rounds is for ages 21 and up</h1>
      <p className="text-sm text-foreground/70">
        Based on the date of birth you entered, we&rsquo;re not able to create an account for you. No
        account was kept.
      </p>
      <Link href="/" className="inline-block text-sm underline underline-offset-4">
        Back to the homepage
      </Link>
    </div>
  );
}
