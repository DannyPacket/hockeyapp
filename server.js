// Local development server for hockeyapp
// Serves static files + emulates Netlify functions at /.netlify/functions/*
// Run:  node server.js   (or double-click start-local.bat)
// Then open:  http://localhost:3000

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQM8b4kevAgoInq4xFZ6S1FAi4VdyRSvyFJ15mgUezCqvmK8Io5XIlkXhi6-r7iwuvz3MDv1dQh7Xu-/pub?gid=0&single=true&output=csv";

const MIME = {
  ".html": "text/html",
  ".css":  "text/css",
  ".js":   "application/javascript",
  ".json": "application/json",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
};

// ── CSV parser ───────────────────────────────────────────────
function splitLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current); current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
    const fields = splitLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (fields[i] || "").replace(/^"|"$/g, "").trim(); });
    return row;
  }).filter(row => Object.values(row).some(v => v !== ""));
}

// ── Handler: fetch-games ─────────────────────────────────────
async function handleFetchGames(res) {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error("Sheet fetch failed: " + response.status);
    const csv = await response.text();
    const games = parseCSV(csv);
    sendJSON(res, 200, { games, fetchedAt: new Date().toISOString() });
  } catch (err) {
    sendJSON(res, 500, { error: err.message, games: [] });
  }
}

// ── NHL API helpers ──────────────────────────────────────────

// Find the Bruins' NHL game ID for a given date (YYYY-MM-DD)
async function findNhlGameIdByDate(isoDate) {
  try {
    const r = await fetch(`https://api-web.nhle.com/v1/score/${isoDate}`);
    if (!r.ok) return null;
    const data = await r.json();
    for (const game of (data.games || [])) {
      if (game.awayTeam?.abbrev === "BOS" || game.homeTeam?.abbrev === "BOS") {
        return String(game.id);
      }
    }
  } catch (_) {}
  return null;
}

// Find the ESPN event ID for the Bruins game on a given date (YYYYMMDD)
async function findEspnEventIdByDate(date) {
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`
    );
    if (!r.ok) return null;
    const sb = await r.json();
    for (const ev of (sb.events || [])) {
      for (const comp of (ev.competitions || [])) {
        for (const team of (comp.competitors || [])) {
          if (team.team?.abbreviation === "BOS") return String(ev.id);
        }
      }
    }
  } catch (_) {}
  return null;
}

function periodLabel(pd) {
  if (!pd) return "";
  if (pd.periodType === "OT") return "OT";
  if (pd.periodType === "SO") return "SO";
  const names = ["", "1st", "2nd", "3rd"];
  return names[pd.number] || `P${pd.number}`;
}

async function fetchNhlGameData(nhlGameId) {
  const [landingRes, railRes] = await Promise.all([
    fetch(`https://api-web.nhle.com/v1/gamecenter/${nhlGameId}/landing`),
    fetch(`https://api-web.nhle.com/v1/gamecenter/${nhlGameId}/right-rail`),
  ]);
  if (!landingRes.ok) throw new Error(`NHL API error: ${landingRes.status}`);
  const raw = await landingRes.json();

  // Score
  const away = raw.awayTeam || {};
  const home = raw.homeTeam || {};
  const score = {
    awayAbbr:  away.abbrev || "",
    homeAbbr:  home.abbrev || "",
    awayScore: String(away.score ?? ""),
    homeScore: String(home.score ?? ""),
    status:    raw.gameState === "OFF" || raw.gameState === "FINAL" ? "Final" : (raw.gameState || "Final"),
  };

  // Period breakdown
  const periodsRaw = raw.summary?.scoring || [];
  const periods = periodsRaw.map(p => {
    const awayGoals = (p.goals || []).filter(g => !g.isHome).length;
    const homeGoals = (p.goals || []).filter(g =>  g.isHome).length;
    return {
      label: periodLabel(p.periodDescriptor),
      away:  String(awayGoals),
      home:  String(homeGoals),
    };
  });

  // Scoring plays — use full firstName + lastName from the goals array
  const scoringPlays = periodsRaw.flatMap(p => {
    const label = periodLabel(p.periodDescriptor);
    return (p.goals || []).map(g => {
      const fullScorer  = `${g.firstName?.default || ""} ${g.lastName?.default || ""}`.trim() || g.name?.default || "";
      const fullAssists = (g.assists || []).map(a =>
        `${a.firstName?.default || ""} ${a.lastName?.default || ""}`.trim() || a.name?.default || ""
      ).filter(Boolean);
      return {
        period:       label,
        time:         g.timeInPeriod || "",
        team:         g.teamAbbrev?.default || "",
        scorer:       fullScorer,
        assists:      fullAssists,
        awayScore:    String(g.awayScore ?? ""),
        homeScore:    String(g.homeScore ?? ""),
        shotType:     g.shotType || "",
        goalModifier: g.goalModifier || "",
        text:         "",
        headshot:     g.headshot || "",
        highlightUrl: g.highlightClipSharingUrl || "",
      };
    });
  });

  // Three stars — fetch full names from player profiles in parallel
  const starsRaw = raw.summary?.threeStars || [];
  const starProfiles = await Promise.all(
    starsRaw.map(s =>
      fetch(`https://api-web.nhle.com/v1/player/${s.playerId}/landing`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  const stars = starsRaw.map((s, i) => {
    const prof = starProfiles[i];
    const first = prof?.firstName?.default || "";
    const last  = prof?.lastName?.default  || "";
    const fullName = (first + " " + last).trim() || s.name?.default || "";

    const statParts = [];
    if (s.goals   != null) statParts.push({ label: "G",   value: String(s.goals) });
    if (s.assists != null) statParts.push({ label: "A",   value: String(s.assists) });
    if (s.points  != null) statParts.push({ label: "PTS", value: String(s.points) });
    if (s.savePctg != null) {
      const pct = s.savePctg >= 1.0
        ? "1.000"
        : "." + String(Math.round(s.savePctg * 1000)).padStart(3, "0");
      statParts.push({ label: "SV%", value: pct });
    }
    if (s.goalsAgainstAverage != null) statParts.push({ label: "GAA", value: s.goalsAgainstAverage.toFixed(2) });

    return {
      order:    s.star,
      name:     fullName,
      team:     s.teamAbbrev || "",
      pos:      s.position || "",
      headshot: s.headshot || "",
      stats:    statParts,
    };
  });

  // Team stats from right-rail
  const STAT_LABELS = {
    sog:                 "Shots",
    hits:                "Hits",
    pim:                 "PIM",
    faceoffWinningPctg:  "Faceoff %",
    powerPlay:           "Power Play",
    blockedShots:        "Blocked Shots",
  };
  const STAT_ORDER = ["sog", "hits", "pim", "faceoffWinningPctg", "powerPlay", "blockedShots"];

  let teamStats = [];
  if (railRes?.ok) {
    const rail = await railRes.json();
    const raw2 = rail.teamGameStats || [];
    teamStats = STAT_ORDER
      .map(cat => {
        const entry = raw2.find(s => s.category === cat);
        if (!entry) return null;
        let away = entry.awayValue;
        let home = entry.homeValue;
        if (cat === "faceoffWinningPctg") {
          away = (away * 100).toFixed(1) + "%";
          home = (home * 100).toFixed(1) + "%";
        }
        return { label: STAT_LABELS[cat], away: String(away), home: String(home) };
      })
      .filter(Boolean);
  }

  return { score, periods, scoringPlays, stars, teamStats };
}

// ── ESPN fallback ─────────────────────────────────────────────
async function fetchEspnGameData(id) {
  const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${id}`);
  if (!r.ok) throw new Error(`ESPN summary error: ${r.status}`);
  const raw = await r.json();

  const comp        = raw.header?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const awayC       = competitors.find(c => c.homeAway === "away") || competitors[0] || {};
  const homeC       = competitors.find(c => c.homeAway === "home") || competitors[1] || {};
  const score = {
    awayAbbr:  awayC.team?.abbreviation || "",
    homeAbbr:  homeC.team?.abbreviation || "",
    awayScore: awayC.score || "",
    homeScore: homeC.score || "",
    status:    comp.status?.type?.shortDetail || "Final",
  };

  const linescore = raw.boxscore?.linescore || [];
  let periods = [];
  if (linescore.length >= 2 && linescore[0]?.columns) {
    const labelCols = (linescore[0].columns || []).slice(0, -1);
    const awayCols  = (linescore[1]?.columns || []).slice(0, -1);
    const homeCols  = (linescore[2]?.columns || []).slice(0, -1);
    periods = labelCols.map((lbl, i) => ({
      label: lbl.text || "",
      away:  awayCols[i]?.text ?? "",
      home:  homeCols[i]?.text ?? "",
    }));
  } else if (linescore.length && linescore[0]?.away !== undefined) {
    periods = linescore.map(p => ({
      label: p.displayValue || String(p.period || ""),
      away:  String(p.away ?? ""),
      home:  String(p.home ?? ""),
    }));
  }

  const allPlays        = raw.plays || [];
  const scoringPlays    = allPlays.filter(p => p.scoringPlay).map(p => {
    const parts   = p.participants || [];
    const scorer  = parts.find(x => (x.type?.text || "").toLowerCase().includes("scor"));
    const assists = parts.filter(x => (x.type?.text || "").toLowerCase().includes("assist"));
    return {
      period:    p.period?.displayValue || "",
      time:      p.clock?.displayValue || "",
      team:      p.team?.abbreviation || "",
      scorer:    scorer?.athlete?.displayName || p.text || "",
      assists:   assists.map(a => a.athlete?.displayName || "").filter(Boolean),
      awayScore: p.awayScore ?? "",
      homeScore: p.homeScore ?? "",
      shotType:  p.scoringType?.displayName || "",
      text:      p.text || "",
    };
  });

  return { score, periods, scoringPlays, stars: [] };
}

// ── Handler: espn-game ───────────────────────────────────────
async function handleEspnGame(res, params) {
  const { date, eventId, nhlGameId } = params;
  try {
    let espnId = eventId || null;
    let result = null;

    // Convert date param to ISO (YYYYMMDD → YYYY-MM-DD)
    const isoDate = date
      ? (date.length === 8 ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}` : date)
      : null;

    // Primary: NHL API — resolve game ID and ESPN event ID in parallel from the date
    let resolvedNhlId = nhlGameId || null;
    if (isoDate && (!resolvedNhlId || !espnId)) {
      const [nhlId, espnEventId] = await Promise.all([
        resolvedNhlId ? Promise.resolve(resolvedNhlId) : findNhlGameIdByDate(isoDate),
        espnId        ? Promise.resolve(espnId)        : findEspnEventIdByDate(date),
      ]);
      if (!resolvedNhlId) resolvedNhlId = nhlId;
      if (!espnId) espnId = espnEventId;
    }

    if (resolvedNhlId) {
      try {
        result = await fetchNhlGameData(resolvedNhlId);
      } catch (e) {
        console.warn("[NHL API] failed:", e.message, "— falling back to ESPN");
      }
    }

    // Fallback: ESPN by eventId or date
    if (!result) {
      if (!espnId && date) {
        const sbRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`
        );
        if (!sbRes.ok) throw new Error(`Scoreboard fetch failed: ${sbRes.status}`);
        const sb = await sbRes.json();
        for (const ev of (sb.events || [])) {
          for (const comp of (ev.competitions || [])) {
            for (const team of (comp.competitors || [])) {
              if (team.team?.abbreviation === "BOS") { espnId = String(ev.id); break; }
            }
            if (espnId) break;
          }
          if (espnId) break;
        }
        if (!espnId) return sendJSON(res, 404, { error: "No Bruins game found for date " + (isoDate || date) });
      }

      if (!espnId) return sendJSON(res, 400, { error: "Provide ?date=YYYYMMDD, ?nhlGameId=..., or ?eventId=..." });

      result = await fetchEspnGameData(espnId);
    }

    sendJSON(res, 200, {
      eventId: espnId || null,
      nhlGameId: nhlGameId || null,
      ...result,
    });
  } catch (err) {
    sendJSON(res, 500, { error: err.message });
  }
}

// ── Helpers ──────────────────────────────────────────────────
function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
  });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",  // prevent stale JS/HTML in dev
    });
    res.end(data);
  });
}

// ── Main server ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed   = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;
  const params   = Object.fromEntries(parsed.searchParams);

  if (pathname === "/.netlify/functions/fetch-games") return handleFetchGames(res);
  if (pathname === "/.netlify/functions/espn-game")   return handleEspnGame(res, params);

  // Static file serving
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end("Forbidden"); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\nHockey App running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.\n");
});
