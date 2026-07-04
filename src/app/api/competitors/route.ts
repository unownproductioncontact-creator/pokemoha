import { NextResponse, type NextRequest } from "next/server";
import { analyzeAllCompetitors } from "@/lib/competitorService";
import { addCompetitor, removeCompetitor } from "@/lib/competitorStore";
import { buildDemoCompetitors } from "@/lib/demoData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("demo") === "1") {
    return NextResponse.json(buildDemoCompetitors());
  }
  return NextResponse.json(await analyzeAllCompetitors());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (
    body.action === "add" &&
    typeof body.ref === "string" &&
    body.ref.trim()
  ) {
    const item = await addCompetitor(body.ref.trim(), body.label);
    return NextResponse.json({ ok: true, item });
  }
  if (body.action === "remove" && typeof body.id === "string") {
    await removeCompetitor(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { ok: false, error: "Requête invalide" },
    { status: 400 },
  );
}
