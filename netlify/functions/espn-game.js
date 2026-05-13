// /.netlify/functions/espn-game
// Proxies NHL + ESPN APIs server-side (no CORS issues).
// Called by the frontend as:
//   /.netlify/functions/espn-game?date=YYYYMMDD
//   /.netlify/functions/espn-game?date=YYYYMMDD&nhlGameId=...&eventId=...

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
};

function ok(body)  { return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) }; }
function err(code, msg) { return { statusCode: code, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }

// ── NHL date lookup ───────────────────────────────────────────
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

// ── ESPN event ID lookup ──────────────────────────────────────
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

// ── Period label ──────────────────────────────────────────────
function periodLabel(pd) {
  if (!pd) return "";
  if (pd.periodType === "OT") return "OT";
  if (pd.periodType === "SO") return "SO";
  return ["", "1st", "2nd", "3rd"][pd.number] || `P${pd.number}`;
}

// ── NHL primary data fetch ────────────────────────────────────
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
  const periods = periodsRaw.map(p => ({
    label: periodLabel(p.periodDescriptor),
    away:  String((p.goals || []).filter(g => !g.isHome).length),
    home:  String((p.goals || []).filter(g =>  g.isHome).length),
  }));

  // Scoring plays — full first + last names
  const scoringPlays = periodsRaw.flatMap(p => {
    const label = periodLabel(p.periodDescriptor);
    return (p.goals || []).map(g => ({
      period:       label,
      time:         g.timeInPeriod || "",
      team:         g.teamAbbrev?.default || "",
      scorer:       `${g.firstName?.default || ""} ${g.lastName?.default || ""}`.trim() || g.name?.default || "",
      assists:      (g.assists || []).map(a =>
                      `${a.firstName?.default || ""} ${a.lastName?.default || ""}`.trim() || a.name?.default || ""
                    ).filter(Boolean),
      awayScore:    String(g.awayScore ?? ""),
      homeScore:    String(g.homeScore ?? ""),
      shotType:     g.shotType || "",
      goalModifier: g.goalModifier || "",
      text:         "",
      headshot:     g.headshot || "",
      highlightUrl: g.highlightClipSharingUrl || "",
    }));
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
    const fullName = (`${prof?.firstName?.default || ""} ${prof?.lastName?.default || ""}`).trim()
                     || s.name?.default || "";
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
    sog: "Shots", hits: "Hits", pim: "PIM",
    faceoffWinningPctg: "Faceoff %", powerPlay: "Power Play", blockedShots: "Blocked Shots",
  };
  const STAT_ORDER = ["sog", "hits", "pim", "faceoffWinningPctg", "powerPlay", "blockedShots"];
  let teamStats = [];
  if (railRes?.ok) {
    const rail = await railRes.json();
    teamStats = STAT_ORDER.map(cat => {
      const entry = (rail.teamGameStats || []).find(s => s.category === cat);
      if (!entry) return null;
      let away = entry.awayValue, home = entry.homeValue;
      if (cat === "faceoffWinningPctg") {
        away = (away * 100).toFixed(1) + "%";
        home = (home * 100).toFixed(1) + "%";
      }
      return { label: STAT_LABELS[cat], away: String(away), home: String(home) };
    }).filter(Boolean);
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

  const scoringPlays = (raw.plays || []).filter(p => p.scoringPlay).map(p => {
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

  return { score, periods, scoringPlays, stars: [], teamStats: [] };
}

// ── Handler ───────────────────────────────────────────────────
exports.handler = async (event) => {
  const { date, eventId, nhlGameId } = event.queryStringParameters || {};

  try {
    let espnId = eventId || null;
    let result = null;

    const isoDate = date
      ? (date.length === 8 ? `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}` : date)
      : null;

    // Resolve NHL game ID and ESPN event ID in parallel from the date
    let resolvedNhlId = nhlGameId || null;
    if (isoDate && (!resolvedNhlId || !espnId)) {
      const [nhlId, espnEventId] = await Promise.all([
        resolvedNhlId ? Promise.resolve(resolvedNhlId) : findNhlGameIdByDate(isoDate),
        espnId        ? Promise.resolve(espnId)        : findEspnEventIdByDate(date),
      ]);
      if (!resolvedNhlId) resolvedNhlId = nhlId;
      if (!espnId) espnId = espnEventId;
    }

    // Primary: NHL API
    if (resolvedNhlId) {
      try {
        result = await fetchNhlGameData(resolvedNhlId);
      } catch (e) {
        console.warn("[NHL API] failed:", e.message, "— falling back to ESPN");
      }
    }

    // Fallback: ESPN
    if (!result) {
      if (!espnId) return err(404, "No Bruins game found for date " + (isoDate || date || "unknown"));
      result = await fetchEspnGameData(espnId);
    }

    return ok({ eventId: espnId || null, nhlGameId: resolvedNhlId || null, ...result });

  } catch (e) {
    return err(500, e.message);
  }
};
