import { NextResponse, type NextRequest } from "next/server";
import { getTrends } from "@/lib/worldService";
import { buildDemoTrends } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoTrends());
  }
  return NextResponse.json(await getTrends(sp.get("region") ?? "FR"));
}
