// /.netlify/functions/espn-player
// Returns { id, url } for an NHL player by display name.

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const ok  = body  => ({ statusCode: 200, headers: HEADERS, body: JSON.stringify(body) });
const err = (c,m) => ({ statusCode: c,   headers: HEADERS, body: JSON.stringify({ error: m }) });

function buildUrl(id, displayName) {
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `https://www.espn.com/nhl/player/stats/_/id/${id}/${slug}`;
}

// All ESPN NHL team IDs — verified via ESPN teams endpoint
const ESPN_NHL_TEAM_IDS = [
  1,      // BOS — try first (Bruins app)
  25, 2, 3, 7, 4, 17, 29, 9, 5, 6, 26, 8, 30, 10, 27,
  11, 12, 13, 14, 15, 16, 18, 124292, 19, 20, 21, 129764, 22, 37, 23, 28,
];

// Search all 32 NHL team rosters in parallel batches for a player by display name.
// Reliable fallback when ESPN search API is down.
async function findInRosters(name) {
  const nameLower = name.toLowerCase();
  const BATCH = 8;
  for (let i = 0; i < ESPN_NHL_TEAM_IDS.length; i += BATCH) {
    const batch = ESPN_NHL_TEAM_IDS.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async teamId => {
        try {
          const r = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/roster`
          );
          if (!r.ok) return null;
          const j = await r.json();
          const players = (j.athletes || []).flatMap(g => g.items || []);
          const found = players.find(p =>
            (p.displayName || p.fullName || "").toLowerCase() === nameLower
          );
          return found?.id ? { id: String(found.id), displayName: found.displayName || name } : null;
        } catch (_) { return null; }
      })
    );
    const hit = results.find(Boolean);
    if (hit) return hit;
  }
  return null;
}

exports.handler = async (event) => {
  const name = ((event.queryStringParameters || {}).name || "").trim();
  if (!name) return err(400, "name required");

  try {
    // 1. ESPN common search API (handles current + historical — may be down)
    const r = await fetch(
      `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=10&type=players`
    );
    if (r.ok) {
      const j = await r.json();
      for (const group of (j.results || [])) {
        for (const item of (group.contents || [])) {
          if ((item.displayName || "").toLowerCase() === name.toLowerCase() && item.id) {
            return ok({ id: String(item.id), url: buildUrl(item.id, item.displayName) });
          }
        }
      }
      // No exact match — take the first result if any returned
      const first = (j.results || [])[0]?.contents?.[0];
      if (first?.id) {
        return ok({ id: String(first.id), url: buildUrl(first.id, first.displayName || name) });
      }
    }

    // 2. All 32 NHL team rosters in parallel batches (works even when search is down)
    const rosterHit = await findInRosters(name);
    if (rosterHit) {
      return ok({ id: rosterHit.id, url: buildUrl(rosterHit.id, rosterHit.displayName) });
    }

    // 3. ESPN NHL athlete search endpoint (last resort)
    const r2 = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/athletes?search=${encodeURIComponent(name)}&limit=5`
    );
    if (r2.ok) {
      const j2 = await r2.json();
      const items = j2.items || j2.athletes || [];
      const match = items.find(a => {
        const dn = (a.athlete?.displayName || a.displayName || "").toLowerCase();
        return dn === name.toLowerCase();
      }) || items[0];
      const ath = match?.athlete || match;
      if (ath?.id) {
        return ok({ id: String(ath.id), url: buildUrl(ath.id, ath.displayName || name) });
      }
    }

    return err(404, "Player not found");
  } catch (e) {
    return err(500, e.message);
  }
};
