import { NextResponse, type NextRequest } from "next/server";
import { discoverSimilar } from "@/lib/competitorService";
import { buildDemoDiscover } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("demo") === "1") {
    return NextResponse.json({ channels: buildDemoDiscover() });
  }
  return NextResponse.json({ channels: await discoverSimilar() });
}
