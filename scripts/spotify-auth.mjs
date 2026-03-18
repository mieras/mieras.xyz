/**
 * One-time Spotify OAuth helper (manual HTTPS flow — no local server needed).
 *
 * Usage:
 *   node scripts/spotify-auth.mjs
 *
 * Prerequisites:
 *   1. In your Spotify App settings, set this redirect URI:
 *      https://mieras.xyz/callback
 *   2. Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are in .env
 *
 * What it does:
 *   - Prints the Spotify authorization URL
 *   - You open it, authorize, and the browser redirects to mieras.xyz/callback
 *     (the page will 404 — that's fine)
 *   - Copy the `code` value from the browser's address bar and paste it here
 *   - The script exchanges it for a refresh token and prints it
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import readline from "node:readline";

const REDIRECT_URI = "https://mieras.xyz/callback";
const SCOPES = "user-read-recently-played";

// Load .env
let envClientId = "";
let envClientSecret = "";
try {
  const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key === "SPOTIFY_CLIENT_ID") envClientId = val;
    if (key === "SPOTIFY_CLIENT_SECRET") envClientSecret = val;
  }
} catch {
  // will prompt
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (ans) => { rl.close(); res(ans.trim()); }));
}

async function main() {
  const clientId = envClientId || await ask("Spotify Client ID: ");
  const clientSecret = envClientSecret || await ask("Spotify Client Secret: ");

  if (!clientId || !clientSecret) {
    console.error("Client ID and Client Secret are required.");
    process.exit(1);
  }

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", SCOPES);

  console.log("\n── Step 1 ─────────────────────────────────────────────────────");
  console.log("Open this URL in your browser:\n");
  console.log(authUrl.toString());
  console.log("\n── Step 2 ─────────────────────────────────────────────────────");
  console.log("After authorizing, your browser will redirect to mieras.xyz/callback");
  console.log("The page will 404 — that's fine.");
  console.log("Copy the value of the `code` parameter from the URL bar.");
  console.log("It looks like: https://mieras.xyz/callback?code=AQD...\n");

  const code = await ask("Paste the code here: ");

  if (!code) {
    console.error("No code provided.");
    process.exit(1);
  }

  console.log("\nExchanging code for tokens...");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || !data.refresh_token) {
    console.error("Token exchange failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n✓ Success! Add this to your .env:\n");
  console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
