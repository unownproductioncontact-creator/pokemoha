// Keep-alive public (pattern masterball) : pingé par UptimeRobot / GitHub
// Actions pour empêcher le spin-down du free tier Render, et utilisé comme
// healthCheckPath natif Render. Hors auth (exclu du matcher de proxy.ts).

export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('ok', { status: 200 });
}
