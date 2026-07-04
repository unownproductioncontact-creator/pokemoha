import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildConsentUrl,
  buildTokenExchangeBody,
  OAUTH_SCOPES,
  GOOGLE_AUTH_ENDPOINT,
} from "./oauthUrl.ts";

test("buildConsentUrl — paramètres requis + scopes", () => {
  const url = buildConsentUrl({
    clientId: "cid.apps.googleusercontent.com",
    redirectUri: "http://localhost:3000/api/oauth/callback",
    state: "abc",
  });
  assert.ok(url.startsWith(GOOGLE_AUTH_ENDPOINT + "?"));
  const u = new URL(url);
  assert.equal(u.searchParams.get("client_id"), "cid.apps.googleusercontent.com");
  assert.equal(
    u.searchParams.get("redirect_uri"),
    "http://localhost:3000/api/oauth/callback",
  );
  assert.equal(u.searchParams.get("response_type"), "code");
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.equal(u.searchParams.get("prompt"), "consent");
  assert.equal(u.searchParams.get("state"), "abc");
  assert.equal(u.searchParams.get("scope"), OAUTH_SCOPES.join(" "));
});

test("OAUTH_SCOPES — les 3 scopes readonly du §2", () => {
  assert.equal(OAUTH_SCOPES.length, 3);
  assert.ok(OAUTH_SCOPES.some((s) => s.endsWith("yt-analytics.readonly")));
  assert.ok(
    OAUTH_SCOPES.some((s) => s.endsWith("yt-analytics-monetary.readonly")),
  );
  assert.ok(OAUTH_SCOPES.some((s) => s.endsWith("youtube.readonly")));
});

test("buildTokenExchangeBody — grant_type authorization_code", () => {
  const body = buildTokenExchangeBody({
    code: "x",
    clientId: "c",
    clientSecret: "s",
    redirectUri: "http://localhost:3000/api/oauth/callback",
  });
  const p = new URLSearchParams(body);
  assert.equal(p.get("grant_type"), "authorization_code");
  assert.equal(p.get("code"), "x");
});
