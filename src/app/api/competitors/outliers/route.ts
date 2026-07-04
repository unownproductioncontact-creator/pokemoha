import { NextResponse, type NextRequest } from "next/server";
import {
  analyzeAllCompetitors,
  flattenCompetitorOutliers,
} from "@/lib/competitorService";
import { buildDemoCompetitors } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result =
    sp.get("demo") === "1"
      ? buildDemoCompetitors()
      : await analyzeAllCompetitors();
  const win = Number(sp.get("window") ?? 0) || 0;
  const limit = Number(sp.get("limit") ?? 50) || 50;
  return NextResponse.json({
    demo: result.demo,
    hasCredentials: result.hasCredentials,
    items: flattenCompetitorOutliers(result, { windowDays: win, limit }),
  });
}
