import { NextResponse, type NextRequest } from "next/server";
import { getCtrReport } from "@/lib/ctrService";
import { buildDemoCtr } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoCtr());
  }
  return NextResponse.json(
    await getCtrReport({ channelId: sp.get("channelId") ?? undefined }),
  );
}
