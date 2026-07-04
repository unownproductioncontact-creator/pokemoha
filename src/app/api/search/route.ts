import { NextResponse, type NextRequest } from "next/server";
import { searchVideos } from "@/lib/worldService";
import { buildDemoScan } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoScan("niche"));
  }
  return NextResponse.json(await searchVideos(q));
}
