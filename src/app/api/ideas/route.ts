import { NextResponse, type NextRequest } from "next/server";
import { getIdeas } from "@/lib/ideaService";
import { buildDemoIdeas } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const daily = sp.get("daily") === "1";
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoIdeas(daily));
  }
  return NextResponse.json(await getIdeas({ daily }));
}
