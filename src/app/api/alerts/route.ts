import { NextResponse, type NextRequest } from "next/server";
import { getAlerts } from "@/lib/alertsService";
import { buildDemoAlerts } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("demo") === "1") {
    return NextResponse.json(buildDemoAlerts());
  }
  return NextResponse.json(await getAlerts());
}
