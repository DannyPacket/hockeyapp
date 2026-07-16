// Geocodes wedding venue addresses from the Google Sheet into
// data/wedding-locations.json, so the map on the Weddings page doesn't need
// to hit a geocoding API on every visitor's page load.
//
// Only geocodes rows missing from the existing cache (pass --force to
// re-geocode everything). Respects Nominatim's 1 request/sec usage policy.
//
// Run:  node scripts/geocode-weddings.js

const fs = require("fs");
const path = require("path");
const { handler: fetchSheetHandler } = require("../netlify/functions/fetch-sheet.js");

const OUT_FILE = path.join(__dirname, "..", "data", "wedding-locations.json");
const UA = "PackeyApp/1.0 (personal weddings site)";
const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

(async () => {
  const result = await fetchSheetHandler({ queryStringParameters: { category: "weddings" } });
  const { entries } = JSON.parse(result.body);

  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch (_) {}

  for (const row of entries) {
    const key = `${row["Date"]}|${row["Whose Wedding"]}`;
    const query = (row["Location"] || "").replace(/\n/g, ", ").trim();

    if (!query || /did not attend/i.test(query)) continue;
    if (existing[key] && !FORCE) continue;

    const hit = await geocode(query);
    if (hit) {
      existing[key] = hit;
      console.log("OK:", row["Whose Wedding"], "->", hit.lat, hit.lon);
    } else {
      console.log("MISS:", row["Whose Wedding"], "-", query, "(try trimming the venue name and re-running)");
    }
    await sleep(1100); // Nominatim usage policy: max 1 request/sec
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
  console.log(`\nSaved ${Object.keys(existing).length} locations to ${OUT_FILE}`);
})();
