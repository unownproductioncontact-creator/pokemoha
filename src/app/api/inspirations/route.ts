import { NextResponse, type NextRequest } from "next/server";
import {
  listInspirations,
  addInspiration,
  removeInspiration,
} from "@/lib/inspirationStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await listInspirations() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.videoId || !body?.title || !body?.url) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const item = await addInspiration({
    videoId: body.videoId,
    title: body.title,
    channelTitle: body.channelTitle,
    ratio: body.ratio,
    thumb: body.thumb,
    url: body.url,
    note: body.note,
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await removeInspiration(id);
  return NextResponse.json({ ok: true });
}
