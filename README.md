# Kiibiki — Directeur YouTube IA

Application web **locale, gratuite et privée** qui audite tes chaînes YouTube,
détecte les vidéos **outliers** (qui sur-performent), analyse tes concurrents et
le monde entier, et génère des **idées / titres / miniatures prouvés par la data**.

> 100% local : aucune donnée ne quitte ta machine, aucune base externe. L'IA
> payante est **optionnelle** ; sans clé, tout fonctionne en local et gratuit.

## Principes (non négociables)

1. **Jamais inventer une donnée.** Chaque chiffre est **Réel** (API), **Estimé**
   (étiqueté) ou **Indisponible**. Le badge de statut accompagne les métriques.
2. CTR / rétention d'un **concurrent** = privés → toujours **indisponible**.
3. **Shorts et vidéos longues toujours séparés** (médianes, outliers, audits…).
4. UI française, sobre, responsive, thème clair/sombre.
5. Toujours expliquer **pourquoi** (preuve + impact), pas juste un score.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 · Tailwind CSS v4 ·
PWA (`app/manifest.ts` + icônes via `next/og`) · `jpeg-js` (analyse miniatures) ·
`@anthropic-ai/sdk` (optionnel). Node ≥ 22.

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # puis remplis ce que tu veux activer
npm run dev                        # http://localhost:3000
```

Sans aucune clé, l'app tourne : utilise le **mode démo** en ajoutant `?demo=1`
à n'importe quelle page (ex : `http://localhost:3000/?demo=1`) pour voir
l'application vivante avec des données **fictives clairement étiquetées**.

## Configuration des APIs (Google Cloud)

Pour tes **vraies** données :

- **Clé YouTube Data API v3** → `YOUTUBE_API_KEY` (lectures publiques :
  concurrents, niche, tendances, recherche, monde).
- **OAuth** (tes chaînes : watch time/rétention via Analytics, CTR via Reporting) :
  - Active **YouTube Data API v3** + **YouTube Analytics API** + **YouTube Reporting API**.
  - Écran de consentement OAuth + ID client OAuth (**Application Web**).
  - URI de redirection autorisée **exacte** : `http://localhost:3000/api/oauth/callback`.
  - Scopes : `yt-analytics.readonly`, `yt-analytics-monetary.readonly`, `youtube.readonly`.
  - Renseigne `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, puis connecte ta chaîne
    depuis **Paramètres**.
- **IA optionnelle** : `ANTHROPIC_API_KEY` + `KIIBIKI_USE_LLM_IDEAS=1`
  (modèle via `KIIBIKI_IDEAS_MODEL`). Vide = moteur d'idées 100% local & gratuit.

Quota Data API ≈ 10 000 u/jour → cache fichiers agressif (`.cache/`),
`search.list` (100 u) minimisé.

## Personnalisation

Tout est **agnostique de la niche** sauf `src/config/` :

- `channels.ts` — tes chaînes (remplace `@TA_CHAINE`).
- `competitors.ts` — concurrents de départ + requêtes de découverte.
- `niches.ts` / `world.ts` — niche, packs régionaux, mécaniques virales.

## Scripts

```bash
npm run dev        # serveur de dev
npm run build      # build de production
npm run typecheck  # tsc --noEmit
npm run test       # node --test src/lib/*.test.ts (logique pure)
npm run lint       # eslint (react-hooks/purity = bloquant)
```

## Les onglets

**Analyse** : Dashboard · Alertes · Outliers · Outliers YouTube · Outliers du
monde · Tendances · Recherche.
**Optimiser** : Audit de chaîne · CTR · Hooks · Miniatures · Optimiser mes vidéos.
**Créer** : Concurrents · Outliers concurrents · Idées Virales Shorts · Idées du
jour · Idées · Top 100 · Analyser une idée · Générateur de titres · Titres &
miniatures.
**Système** : Historique · Diagnostic · Paramètres.

## Architecture

- Modules **purs & testés** (`src/lib/*Core.ts`, `ideaRanking`, `titleGen`…) :
  toute la logique (outliers, audit, hooks, miniatures, idées, monde, alertes).
- **Services serveur** (`*Service.ts`) : appellent l'API YouTube, ne lèvent
  jamais d'exception (statut explicite), cache via `withCache`.
- **Routes API** (`app/api/...`) → **hooks** (`components/dataHooks.ts`) →
  **pages client**. Chaque page gère ses états Chargement / Erreur / Sans clé /
  Démo (`?demo=1`).

Confidentialité : OAuth tokens, concurrents, inspirations et caches vivent
uniquement dans `.cache/` (ignoré par git) — ou dans TON Postgres Neon si tu
héberges (voir ci-dessous).

## Héberger gratuitement (Render, optionnel)

Pattern éprouvé sur masterball-dashboard : Render free + Neon + keep-alive.

1. **Neon** (persistance — le disque Render est éphémère) : crée une base
   gratuite sur [neon.tech](https://neon.tech), copie l'URL pooled
   (`postgresql://…?sslmode=require`) → variable `DATABASE_URL`.
   Sans elle, cache + tokens repartent de zéro à chaque redéploiement.
2. **GitHub** : pousse ce repo, puis sur Render → **New → Blueprint** (le
   [render.yaml](render.yaml) configure tout : build, start, `/healthz`).
3. **Variables Render** (dashboard → Environment) : `YOUTUBE_API_KEY`,
   `DATABASE_URL`, et **obligatoirement `DASHBOARD_PASSWORD`** — c'est lui qui
   protège l'app (Basic Auth navigateur → cookie 60 j signé, anti-bruteforce).
   Sans mot de passe, l'app refuse de servir en production (fail-closed).
   Ajoute aussi `SESSION_SECRET` (`openssl rand -hex 32`) : recommandé pour
   que la session ne dépende pas uniquement du mot de passe.
4. **Anti cold-start** : crée un moniteur [UptimeRobot](https://uptimerobot.com)
   (gratuit) qui ping `https://TON-APP.onrender.com/healthz` toutes les 5 min ;
   le workflow [.github/workflows/keepalive.yml](.github/workflows/keepalive.yml)
   sert de fallback (~12 min) — mets-y ton URL.
5. **OAuth Google** (si utilisé) : ajoute
   `https://TON-APP.onrender.com/api/oauth/callback` aux URI de redirection
   autorisés dans Google Cloud (en plus du localhost).

En local, rien ne change : sans `DATABASE_URL` ni `DASHBOARD_PASSWORD`,
l'app reste 100% fichiers locaux et sans mot de passe.
