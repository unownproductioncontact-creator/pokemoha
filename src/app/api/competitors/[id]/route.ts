import { NextResponse, type NextRequest } from "next/server";
import { analyzeCompetitorById } from "@/lib/competitorService";
import { buildDemoCompetitorById } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (req.nextUrl.searchParams.get("demo") === "1") {
    const d = buildDemoCompetitorById(id);
    return NextResponse.json(
      d ?? { status: "error", message: "Concurrent de démo introuvable" },
    );
  }
  const a = await analyzeCompetitorById(id);
  return NextResponse.json(
    a ?? { status: "error", message: "Concurrent introuvable" },
  );
}
