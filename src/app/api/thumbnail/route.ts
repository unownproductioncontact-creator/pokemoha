import { NextResponse, type NextRequest } from "next/server";
import { analyzeThumbUrl, thumbUrlForVideo } from "@/lib/thumbnailService";
import { buildDemoThumb } from "@/lib/demoData";
import { extractChannelRef } from "@/lib/ytParse";

export const dynamic = "force-dynamic";

function videoIdFromInput(input: string): string | null {
  const t = input.trim();
  const m = t.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(t)) return t;
  return null;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("demo") === "1") {
    return NextResponse.json(buildDemoThumb());
  }
  const url = sp.get("url");
  const videoId = sp.get("videoId");
  let target: string | null = null;
  if (url) {
    const id = videoIdFromInput(url);
    target = id ? thumbUrlForVideo(id) : url;
  } else if (videoId) {
    const id = videoIdFromInput(videoId);
    target = thumbUrlForVideo(id ?? videoId);
  }
  if (!target) {
    return NextResponse.json(
      { status: "error", message: "videoId ou url requis." },
      { status: 400 },
    );
  }
  const analysis = await analyzeThumbUrl(target);
  if (!analysis) {
    return NextResponse.json({
      status: "error",
      message: "Miniature illisible (URL invalide ou format non-JPEG).",
    });
  }
  return NextResponse.json({ status: "ok", analysis, thumbUrl: target });
}
