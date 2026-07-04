import { NextResponse } from "next/server";
import { listCacheEntries } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ entries: await listCacheEntries() });
}
