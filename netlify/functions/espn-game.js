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
  const [landingRes, railRes, boxRes] = await Promise.all([
    fetch(`https://api-web.nhle.com/v1/gamecenter/${nhlGameId}/landing`),
    fetch(`https://api-web.nhle.com/v1/gamecenter/${nhlGameId}/right-rail`),
    fetch(`https://api-web.nhle.com/v1/gamecenter/${nhlGameId}/boxscore`),
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

  // Goalies from NHL boxscore
  const goalies = [];
  if (boxRes?.ok) {
    try {
      const box    = await boxRes.json();
      const awayAbbr = (raw.awayTeam?.abbrev || "").toUpperCase();
      const homeAbbr = (raw.homeTeam?.abbrev || "").toUpperCase();
      const extractNhlGoalies = (glList, abbr) => {
        for (const g of (glList || [])) {
          const name = g.name?.default
            || `${g.firstName?.default || ""} ${g.lastName?.default || ""}`.trim();
          if (!name) continue;
          // NHL API sets decision only for the deciding goalie ("W" or "L"); others get ""
          const rawDec = (g.decision || "").trim().toUpperCase();
          const decision = rawDec === "W" ? "W" : rawDec === "L" ? "L" : null;
          // Only include goalies who have an explicit decision (starter) or at least some saves
          if (!decision && g.saves == null) continue;
          goalies.push({
            name,
            team: abbr,
            decision: decision || (abbr === awayAbbr
              ? (parseInt(score.awayScore,10) > parseInt(score.homeScore,10) ? "W" : "L")
              : (parseInt(score.homeScore,10) > parseInt(score.awayScore,10) ? "W" : "L")),
            saves:        typeof g.saves        === "number" ? g.saves        : null,
            goalsAgainst: typeof g.goalsAgainst === "number" ? g.goalsAgainst : null,
          });
        }
      };
      extractNhlGoalies(box.playerByGameStats?.awayTeam?.goalies, awayAbbr);
      extractNhlGoalies(box.playerByGameStats?.homeTeam?.goalies, homeAbbr);
    } catch (_) {}
  }

  return { score, periods, scoringPlays, stars, teamStats, goalies };
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

  // Periods — three ESPN formats
  const linescore = raw.boxscore?.linescore || [];
  let periods = [];
  if (linescore.length >= 2 && linescore[0]?.columns) {
    // Format A: linescore rows with .columns (header + team rows)
    const labelCols = (linescore[0].columns || []).slice(0, -1);
    const awayCols  = (linescore[1]?.columns || []).slice(0, -1);
    const homeCols  = (linescore[2]?.columns || []).slice(0, -1);
    periods = labelCols.map((lbl, i) => ({
      label: lbl.text || "",
      away:  awayCols[i]?.text ?? "",
      home:  homeCols[i]?.text ?? "",
    }));
  } else if (linescore.length && linescore[0]?.away !== undefined) {
    // Format B: per-period objects with away/home
    periods = linescore.map(p => ({
      label: p.displayValue || String(p.period || ""),
      away:  String(p.away ?? ""),
      home:  String(p.home ?? ""),
    }));
  } else {
    // Format C: linescores embedded in each competitor (international/tournament games)
    const awayLs  = awayC.linescores || [];
    const homeLs  = homeC.linescores || [];
    const PLABELS = ["1st", "2nd", "3rd", "OT", "SO"];
    if (awayLs.length) {
      periods = awayLs.map((ls, i) => ({
        label: PLABELS[i] || `P${i + 1}`,
        away:  ls.displayValue || String(ls.value ?? ""),
        home:  homeLs[i]?.displayValue || String(homeLs[i]?.value ?? ""),
      }));
    }
  }

  // Team ID → abbreviation map (built early so scoring plays can use it)
  const teamAbbrById = {};
  competitors.forEach(c => {
    if (c.team?.id) teamAbbrById[c.team.id] = c.team?.abbreviation || c.team?.name || "";
  });

  // Scoring plays — robust participant type matching + text fallback
  const scoringPlays = (raw.plays || []).filter(p => p.scoringPlay).map(p => {
    const parts = p.participants || [];
    const isScorer = t => /scor|goal/i.test(t);
    const isAssist = t => /assist/i.test(t);
    let scorerPart  = parts.find(x => isScorer(x.type?.text || ""));
    let assistParts = parts.filter(x => isAssist(x.type?.text || ""));
    // Fallback: first participant = scorer, rest = assists
    if (!scorerPart && parts.length) {
      scorerPart  = parts[0];
      assistParts = parts.slice(1);
    }
    let scorerName  = scorerPart?.athlete?.displayName || "";
    let assistNames = assistParts.map(a => a.athlete?.displayName || "").filter(Boolean);
    if (!scorerName) {
      // ESPN text format: "Name Goal (N) Shot Type, assists: Name1 (N), Name2 (N)"
      const raw   = p.text || "";
      const clean = raw.replace(/\s*\(\d+\)/g, "");
      const aiIdx = clean.search(/,?\s*assists?:/i);
      let   sRaw  = aiIdx >= 0 ? clean.slice(0, aiIdx) : clean;
      const aRaw  = aiIdx >= 0 ? clean.slice(aiIdx).replace(/^,?\s*assists?:\s*/i, "") : "";
      sRaw        = sRaw.replace(/\s+Goal\b.*/i, "").trim();
      scorerName  = sRaw || raw;
      assistNames = aRaw ? aRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    }
    const teamAbbr = p.team?.abbreviation || teamAbbrById[p.team?.id] || p.team?.name || "";
    return {
      period:    p.period?.displayValue || "",
      time:      p.clock?.displayValue || "",
      team:      teamAbbr,
      scorer:    scorerName,
      assists:   assistNames,
      awayScore: p.awayScore ?? "",
      homeScore: p.homeScore ?? "",
      shotType:  p.scoringType?.displayName || "",
      text:      p.text || "",
    };
  });

  // Build player stats lookup from boxscore.players (skaters + goalies)
  const playerStatsById = {};
  for (const teamPlayers of (raw.boxscore?.players || [])) {
    for (const group of (teamPlayers.statistics || [])) {
      const keys     = group.keys || [];
      const isGoalie = (group.name || "").toLowerCase().includes("goali");
      for (const entry of (group.athletes || [])) {
        const pid = String(entry.athlete?.id || "");
        if (!pid) continue;
        const statObj = {};
        (entry.stats || []).forEach((v, i) => { if (keys[i]) statObj[keys[i]] = v; });
        playerStatsById[pid] = { statObj, isGoalie };
      }
    }
  }

  // Three stars from featuredAthletes (firstStar / secondStar / thirdStar)
  const STAR_ORDER = { firstStar: 1, secondStar: 2, thirdStar: 3 };
  const stars = (comp.status?.featuredAthletes || [])
    .filter(fa => STAR_ORDER[fa.name])
    .map(fa => {
      const ath       = fa.athlete || {};
      const teamAbbr  = teamAbbrById[fa.team?.id] || fa.team?.abbreviation || fa.team?.name || "";
      const pid       = String(ath.id || fa.playerId || "");
      const pdata     = playerStatsById[pid] || {};
      const { statObj = {}, isGoalie = false } = pdata;
      const statParts = [];
      if (isGoalie) {
        if (statObj.saves    != null) statParts.push({ label: "SV",  value: statObj.saves });
        if (statObj.savePct  != null) statParts.push({ label: "SV%", value: statObj.savePct });
      } else {
        const g   = statObj.goals   != null ? parseInt(statObj.goals,   10) : null;
        const a   = statObj.assists != null ? parseInt(statObj.assists,  10) : null;
        if (g != null) statParts.push({ label: "G",   value: String(g) });
        if (a != null) statParts.push({ label: "A",   value: String(a) });
        if (g != null && a != null) statParts.push({ label: "PTS", value: String(g + a) });
      }
      return {
        order:    STAR_ORDER[fa.name],
        name:     ath.displayName || ath.fullName || ath.shortName || "",
        team:     teamAbbr,
        pos:      ath.position?.abbreviation || "",
        headshot: ath.headshot?.href || (typeof ath.headshot === "string" ? ath.headshot : "") || "",
        stats:    statParts,
      };
    })
    .sort((a, b) => a.order - b.order);

  // Team stats from boxscore.teams[n].statistics (or .team.statistics)
  const boxTeams  = raw.boxscore?.teams || [];
  const awayBT    = boxTeams.find(t => t.homeAway === "away") || boxTeams[0] || {};
  const homeBT    = boxTeams.find(t => t.homeAway === "home") || boxTeams[1] || {};
  const awayStats = awayBT.statistics || awayBT.team?.statistics || [];
  const homeStats = homeBT.statistics || homeBT.team?.statistics || [];
  console.log("[ESPN] boxTeams count:", boxTeams.length, "awayStats:", awayStats.length, "homeStats:", homeStats.length);
  console.log("[ESPN] featuredAthletes count:", (comp.status?.featuredAthletes || []).length);
  console.log("[ESPN] stars found:", stars.length, stars.map(s => s.name));

  function getStat(stats, ...names) {
    for (const n of names) {
      const s = stats.find(x => x.name === n);
      if (s) return s.displayValue;
    }
    return null;
  }

  const STAT_DEFS = [
    { names: ["shotsTotal", "shotOnGoal", "shots"], label: "Shots",         fmt: v => v },
    { names: ["hits"],                               label: "Hits",          fmt: v => v },
    { names: ["penaltyMinutes", "pim"],              label: "PIM",           fmt: v => v },
    { names: ["faceOffWinPct","faceoffWinPct","faceOffsWonPct","faceoffWonPct"], label: "Faceoff %", fmt: v => `${parseFloat(v).toFixed(1)}%` },
    { names: ["blockedShots"],                       label: "Blocked Shots", fmt: v => v },
  ];
  const teamStats = [];
  for (const { names, label, fmt } of STAT_DEFS) {
    const aw = getStat(awayStats, ...names);
    const hm = getStat(homeStats, ...names);
    if (aw != null && hm != null) teamStats.push({ label, away: fmt(aw), home: fmt(hm) });
  }
  // Power play — insert after PIM
  const awPPG = getStat(awayStats, "powerPlayGoals") ?? "0";
  const awPPO = getStat(awayStats, "powerPlayOpportunities") ?? "0";
  const hmPPG = getStat(homeStats, "powerPlayGoals") ?? "0";
  const hmPPO = getStat(homeStats, "powerPlayOpportunities") ?? "0";
  const ppIdx = teamStats.findIndex(s => s.label === "PIM");
  teamStats.splice(ppIdx + 1, 0, { label: "Power Play", away: `${awPPG}/${awPPO}`, home: `${hmPPG}/${hmPPO}` });

  // Goalies from ESPN boxscore players
  const goalies = [];
  const awayScore = parseInt(score.awayScore, 10);
  const homeScore = parseInt(score.homeScore, 10);
  for (const teamPlayers of (raw.boxscore?.players || [])) {
    const teamId   = String(teamPlayers.team?.id || "");
    const teamAbbr = (teamAbbrById[teamId] || teamPlayers.team?.abbreviation || "").toUpperCase();
    const isAway   = teamAbbr === score.awayAbbr.toUpperCase();
    const teamWon  = isAway ? awayScore > homeScore : homeScore > awayScore;
    const derivedDecision = teamWon ? "W" : "L";
    for (const group of (teamPlayers.statistics || [])) {
      if (!(group.name || "").toLowerCase().includes("goali")) continue;
      const keys = group.keys || [];
      for (const entry of (group.athletes || [])) {
        const name = entry.athlete?.displayName || entry.athlete?.fullName || "";
        if (!name) continue;
        const statObj = {};
        (entry.stats || []).forEach((v, i) => { if (keys[i]) statObj[keys[i]] = v; });
        const saves = statObj.saves != null ? parseInt(statObj.saves, 10) : null;
        const goalsAgainst = statObj.goalsAgainst != null ? parseInt(statObj.goalsAgainst, 10) : null;
        // ESPN sometimes provides a "decision" key: "W", "L", "OT", or ""
        const rawDec = (statObj.decision || "").toUpperCase();
        const decision = rawDec === "W" ? "W" : rawDec === "L" ? "L" : derivedDecision;
        goalies.push({
          name,
          team:         teamAbbr,
          decision,
          saves:        !isNaN(saves)        && saves        != null ? saves        : null,
          goalsAgainst: !isNaN(goalsAgainst) && goalsAgainst != null ? goalsAgainst : null,
        });
      }
    }
  }
  console.log("[ESPN] goalies found:", goalies.length, goalies.map(g => g.name));

  return { score, periods, scoringPlays, stars, teamStats, goalies };
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
