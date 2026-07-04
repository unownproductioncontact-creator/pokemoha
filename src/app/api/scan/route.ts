import { NextResponse, type NextRequest } from "next/server";
import { scanNiche, scanWorld } from "@/lib/worldService";
import { buildDemoScan } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind") === "world" ? "world" : "niche";
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoScan(kind));
  }
  return NextResponse.json(
    kind === "world" ? await scanWorld() : await scanNiche(),
  );
}
