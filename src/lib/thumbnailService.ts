// Analyse de miniature : télécharge le JPEG et le décode LOCALEMENT (jpeg-js),
// puis applique thumbnailCore (gratuit, sans IA). Serveur uniquement.

import jpeg from "jpeg-js";
import { analyzeThumbnail } from "./thumbnailCore";
import type { ThumbAnalysis } from "./thumbnailCore";

export function thumbUrlForVideo(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function analyzeThumbUrl(
  url: string,
): Promise<ThumbAnalysis | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  try {
    const buf = Buffer.from(await res.arrayBuffer());
    const decoded = jpeg.decode(buf, {
      useTArray: true,
      maxMemoryUsageInMB: 128,
      tolerantDecoding: true,
    });
    return analyzeThumbnail({
      width: decoded.width,
      height: decoded.height,
      data: decoded.data,
    });
  } catch {
    return null;
  }
}
