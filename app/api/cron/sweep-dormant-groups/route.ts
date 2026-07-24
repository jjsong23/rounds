import { NextResponse } from "next/server";
import { sweepDormantGroups } from "@/lib/dormancy";

// Scheduled (e.g. Vercel Cron) hit to mark long-idle groups DORMANT. Safe to
// run infrequently or skip a run entirely — see lib/dormancy.ts for why.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sweepDormantGroups();
  return NextResponse.json(result);
}
