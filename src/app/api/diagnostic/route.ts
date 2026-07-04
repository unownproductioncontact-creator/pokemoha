import { NextResponse } from "next/server";
import { getDiagnostic } from "@/lib/diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getDiagnostic());
}
