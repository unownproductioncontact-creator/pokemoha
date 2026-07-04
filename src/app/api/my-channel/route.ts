import { NextResponse, type NextRequest } from "next/server";
import { analyzeMyChannel } from "@/lib/channelService";
import { buildDemoAnalysis } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoAnalysis());
  }
  const channelId = sp.get("channelId") ?? undefined;
  const ref = sp.get("ref") ?? undefined;
  const max = sp.get("max") ? Number(sp.get("max")) : undefined;
  return NextResponse.json(await analyzeMyChannel({ channelId, ref, max }));
}
