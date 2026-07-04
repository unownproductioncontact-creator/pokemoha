// Mode IA OPTIONNEL du moteur d'idées (§6). Dormant tant que KIIBIKI_USE_LLM_IDEAS
// ≠ 1 ou ANTHROPIC_API_KEY absent. Best-effort : en cas d'échec, on garde les
// idées locales (gratuit). Serveur uniquement.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import type { Idea } from "./ideaRanking";

export async function polishIdeasWithLlm(ideas: Idea[]): Promise<Idea[]> {
  const { anthropicApiKey, ideasModel } = env();
  if (!anthropicApiKey || ideas.length === 0) return ideas;
  try {
    const client = new Anthropic({ apiKey: anthropicApiKey });
    const top = ideas.slice(0, 30);
    const prompt =
      "Tu es un stratège YouTube FR. Réécris chaque titre pour le rendre plus accrocheur, honnête et naturel en français, SANS inventer de données ni changer le concept. " +
      "Réponds UNIQUEMENT en JSON : un tableau d'objets {\"id\":string,\"title\":string}.\n" +
      JSON.stringify(top.map((i) => ({ id: i.id, title: i.title })));
    const res = await client.messages.create({
      model: ideasModel,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const arr = JSON.parse(json) as { id: string; title: string }[];
    const map = new Map(arr.map((x) => [x.id, x.title]));
    return ideas.map((i) =>
      map.has(i.id) ? { ...i, title: map.get(i.id) as string } : i,
    );
  } catch {
    return ideas;
  }
}
