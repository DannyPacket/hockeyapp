// Geocodes concert venue names from the Google Sheet into
// data/concert-locations.json, keyed by the exact "Location" cell text (so
// repeat venues share one lookup instead of being geocoded once per show).
//
// Only geocodes venues missing from the existing cache (pass --force to
// re-geocode everything). Respects Nominatim's 1 request/sec usage policy.
//
// Nominatim sometimes matches a same-named venue in the wrong city (e.g. a
// venue name that also exists elsewhere) — always spot-check new results
// against the printed OK lines, and if one's wrong, edit
// data/concert-locations.json directly or re-run with a more specific query
// by temporarily editing the row's Location cell (e.g. add ", Boston, MA").
//
// Run:  node scripts/geocode-concerts.js

const fs = require("fs");
const path = require("path");
const { handler: fetchSheetHandler } = require("../netlify/functions/fetch-sheet.js");

const OUT_FILE = path.join(__dirname, "..", "data", "concert-locations.json");
const UA = "PackeyApp/1.0 (personal concerts site)";
const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name };
}

(async () => {
  const result = await fetchSheetHandler({ queryStringParameters: { category: "concerts" } });
  const { entries } = JSON.parse(result.body);

  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch (_) {}

  const uniqueLocations = [...new Set(entries.map((r) => (r["Location"] || "").trim()).filter(Boolean))];

  for (const loc of uniqueLocations) {
    if (existing[loc] && !FORCE) continue;

    const hit = await geocode(loc);
    if (hit) {
      existing[loc] = { lat: hit.lat, lon: hit.lon };
      console.log("OK:", loc, "->", hit.lat, hit.lon, `(${hit.display_name})`);
    } else {
      console.log("MISS:", loc, "(try adding a city/state and re-running)");
    }
    await sleep(1100); // Nominatim usage policy: max 1 request/sec
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
  console.log(`\nSaved ${Object.keys(existing).length} locations to ${OUT_FILE}`);
})();
