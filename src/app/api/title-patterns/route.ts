import { NextResponse, type NextRequest } from "next/server";
import { getTitlePatterns } from "@/lib/titlePatternsService";
import { buildDemoTitlePatterns } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("demo") === "1") {
    return NextResponse.json(buildDemoTitlePatterns());
  }
  return NextResponse.json(await getTitlePatterns());
}
