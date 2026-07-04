// Analyse visuelle LOCALE & GRATUITE d'une miniature (§5), sans IA. PUR : reçoit
// un buffer RGBA déjà décodé (jpeg-js côté service) → métriques + recommandations.

export interface ThumbMetrics {
  width: number;
  height: number;
  brightness: number; // 0-255
  contrast: number; // écart-type de luminance
  colorfulness: number; // Hasler-Süsstrunk
  saturation: number; // 0-1
  skinRatio: number; // 0-1
  edgeDensity: number; // 0-1
}

export interface ThumbAnalysis {
  metrics: ThumbMetrics;
  faceLikely: boolean;
  textHeavy: boolean;
  recommendations: string[];
}

function lum(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function analyzeThumbnail(img: {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}): ThumbAnalysis {
  const { width, height, data } = img;
  const n = Math.max(1, width * height);
  const step = Math.max(1, Math.floor(Math.sqrt(n / 20000))); // ~20k px max

  let count = 0,
    sumL = 0,
    sumL2 = 0,
    sumS = 0,
    skin = 0;
  let sumRG = 0,
    sumYB = 0,
    sumRG2 = 0,
    sumYB2 = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2];
      const L = lum(r, g, b);
      sumL += L;
      sumL2 += L * L;
      const mx = Math.max(r, g, b),
        mn = Math.min(r, g, b);
      sumS += mx === 0 ? 0 : (mx - mn) / mx;
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15)
        skin++;
      const rg = r - g,
        yb = 0.5 * (r + g) - b;
      sumRG += rg;
      sumYB += yb;
      sumRG2 += rg * rg;
      sumYB2 += yb * yb;
      count++;
    }
  }

  const brightness = sumL / count;
  const contrast = Math.sqrt(Math.max(0, sumL2 / count - (sumL / count) ** 2));
  const saturation = sumS / count;
  const meanRG = sumRG / count,
    meanYB = sumYB / count;
  const stdRG = Math.sqrt(Math.max(0, sumRG2 / count - meanRG * meanRG));
  const stdYB = Math.sqrt(Math.max(0, sumYB2 / count - meanYB * meanYB));
  const colorfulness =
    Math.sqrt(stdRG * stdRG + stdYB * stdYB) +
    0.3 * Math.sqrt(meanRG * meanRG + meanYB * meanYB);
  const skinRatio = skin / count;

  let edges = 0,
    ecount = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = step; x < width; x += step) {
      const i0 = (y * width + x) * 4,
        i1 = (y * width + (x - step)) * 4;
      const d = Math.abs(
        lum(data[i0], data[i0 + 1], data[i0 + 2]) -
          lum(data[i1], data[i1 + 1], data[i1 + 2]),
      );
      if (d > 40) edges++;
      ecount++;
    }
  }
  const edgeDensity = ecount ? edges / ecount : 0;

  const faceLikely = skinRatio > 0.06;
  const textHeavy = edgeDensity > 0.18;

  const recommendations: string[] = [];
  if (brightness < 70)
    recommendations.push(
      "Image sombre (luminosité faible) — éclaircis le sujet ; les vignettes ternes captent moins de clics (impact estimé).",
    );
  else if (brightness > 205)
    recommendations.push(
      "Image très claire/surexposée — garde un sujet bien contrasté.",
    );
  if (contrast < 35)
    recommendations.push(
      "Contraste faible — détache le sujet du fond (contour, ombre, fond plus sombre).",
    );
  if (colorfulness < 25)
    recommendations.push(
      "Peu colorée — ajoute une couleur d'accent vive (rouge/jaune) pour attirer l'œil.",
    );
  if (!faceLikely)
    recommendations.push(
      "Pas de visage détecté — un visage expressif augmente souvent le CTR dans cette niche (estimé).",
    );
  if (textHeavy)
    recommendations.push(
      "Beaucoup de détails/texte — limite à 3-4 mots lisibles en petit (mobile).",
    );
  if (recommendations.length === 0)
    recommendations.push(
      "Bons fondamentaux : luminosité, contraste et couleurs équilibrés.",
    );

  return {
    metrics: {
      width,
      height,
      brightness,
      contrast,
      colorfulness,
      saturation,
      skinRatio,
      edgeDensity,
    },
    faceLikely,
    textHeavy,
    recommendations,
  };
}
