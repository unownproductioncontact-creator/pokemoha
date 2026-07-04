import { NextResponse, type NextRequest } from "next/server";
import { getAuditReport } from "@/lib/auditService";
import { buildDemoAudit } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoAudit());
  }
  return NextResponse.json(
    await getAuditReport({ channelId: sp.get("channelId") ?? undefined }),
  );
}
