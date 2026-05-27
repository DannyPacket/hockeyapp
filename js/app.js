// ── COLUMN MAP ───────────────────────────────────────────────
const COL = {
  date:         "Date",
  opponent:     "Opponent",
  season:       "Season",
  homeAway:     "Location",
  seasonType:   "Pre/Regular/Post",
  goalsFor:     "Bruins Goals",
  goalsAgainst: "Opponents Goals",
  outcome:      "Outcome",
  guest:        "Guest",
  notes:        "Notes",
  playoffRound: "Playoff Round",
  playoffGame:  "Playoff Game",
  spHomeScore:  "Special Event - Home Score",
  spAwayScore:  "Special Event - Away Score",
  spHomeTeam:   "Special Event - Home Team",
  spAwayTeam:   "Special Event - Away Team",
  spOvertime:   "Special Event - Overtime",
};

// ── TEAM LOGOS ────────────────────────────────────────────────
const TEAM_LOGOS = {
  "Anaheim":"ana","Anaheim Ducks":"ana","Arizona":"ari","Arizona Coyotes":"ari","Utah":"uta",
  "Buffalo":"buf","Buffalo Sabres":"buf","Calgary":"cgy","Calgary Flames":"cgy",
  "Carolina":"car","Carolina Hurricanes":"car","Chicago":"chi","Chicago Blackhawks":"chi",
  "Colorado":"col","Colorado Avalanche":"col","Columbus":"cbj","Columbus Blue Jackets":"cbj",
  "Dallas":"dal","Dallas Stars":"dal","Detroit":"det","Detroit Red Wings":"det",
  "Edmonton":"edm","Edmonton Oilers":"edm","Florida":"fla","Florida Panthers":"fla",
  "Los Angeles":"lak","LA Kings":"lak","Los Angeles Kings":"lak",
  "Minnesota":"min","Minnesota Wild":"min","Montreal":"mtl","Montreal Canadiens":"mtl",
  "Nashville":"nsh","Nashville Predators":"nsh","New Jersey":"njd","New Jersey Devils":"njd",
  "NY Islanders":"nyi","New York Islanders":"nyi","NY Rangers":"nyr","New York Rangers":"nyr",
  "Ottawa":"ott","Ottawa Senators":"ott","Philadelphia":"phi","Philadelphia Flyers":"phi",
  "Pittsburgh":"pit","Pittsburgh Penguins":"pit","San Jose":"sjs","San Jose Sharks":"sjs",
  "Seattle":"sea","Seattle Kraken":"sea","St. Louis":"stl","St Louis Blues":"stl","St. Louis Blues":"stl",
  "Tampa Bay":"tbl","Tampa Bay Lightning":"tbl","Toronto":"tor","Toronto Maple Leafs":"tor",
  "Vancouver":"van","Vancouver Canucks":"van","Vegas":"vgk","Vegas Golden Knights":"vgk",
  "Washington":"wsh","Washington Capitals":"wsh","Winnipeg":"wpg","Winnipeg Jets":"wpg",
  "Bruins":"bos","Boston":"bos","Boston Bruins":"bos",
  "Capitals":"wsh","Penguins":"pit","Flyers":"phi","Rangers":"nyr","Islanders":"nyi","Devils":"njd",
  "Hurricanes":"car","Panthers":"fla","Lightning":"tbl","Leafs":"tor","Canadiens":"mtl","Senators":"ott",
  "Sabres":"buf","Jets":"wpg","Flames":"cgy","Oilers":"edm","Canucks":"van","Kraken":"sea",
  "Golden Knights":"vgk","Ducks":"ana","Kings":"lak","Sharks":"sjs","Wild":"min","Stars":"dal",
  "Blues":"stl","Predators":"nsh","Avalanche":"col","Coyotes":"ari","Blackhawks":"chi","Red Wings":"det",
};

const NHL_IDS = {
  ana:1,ari:53,buf:7,cgy:20,car:12,chi:16,col:21,cbj:29,dal:25,det:17,edm:22,fla:13,
  lak:26,min:30,mtl:8,nsh:18,njd:1,nyi:2,nyr:3,ott:9,phi:4,pit:5,sjs:28,sea:55,
  stl:19,tbl:14,tor:10,van:23,vgk:54,wsh:15,wpg:52,bos:6,uta:59,
};

function teamLogo(name) {
  const abbr = TEAM_LOGOS[name];
  if (!abbr) return "";
  const id  = NHL_IDS[abbr];
  const pri = id ? `https://assets.nhle.com/logos/nhl/svg/${abbr.toUpperCase()}_light.svg` : "";
  const fb  = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/${abbr}.png&h=40&w=40`;
  return pri
    ? `<img src="${pri}" alt="${name}" class="team-logo" onerror="this.src='${fb}';this.onerror=function(){this.style.display='none'};">`
    : `<img src="${fb}" alt="${name}" class="team-logo" onerror="this.style.display='none'">`;
}

// Logo by abbreviation — handles NHL teams and international/tournament teams
function abbrLogo(abbr) {
  if (!abbr) return "";
  const a = abbr.toLowerCase();
  const NHL_ABBRS = new Set([
    "ana","ari","bos","buf","cgy","car","chi","col","cbj","dal","det","edm","fla",
    "lak","min","mtl","nsh","njd","nyi","nyr","ott","phi","pit","sjs","sea",
    "stl","tbl","tor","van","vgk","wsh","wpg","uta",
  ]);
  if (NHL_ABBRS.has(a)) {
    const pri = `https://assets.nhle.com/logos/nhl/svg/${abbr.toUpperCase()}_light.svg`;
    const fb  = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/${a}.png&h=40&w=40`;
    return `<img src="${pri}" alt="${abbr}" class="team-logo" onerror="this.src='${fb}';this.onerror=function(){this.style.display='none'};">`;
  }
  // Country flags via flagcdn.com (works on Windows; emoji flags don't)
  const COUNTRY_ISO = {
    can: "ca", ca: "ca", usa: "us", us: "us",
    fin: "fi", fi: "fi", swe: "se", se: "se",
  };
  const iso = COUNTRY_ISO[a];
  if (iso) {
    return `<img src="https://flagcdn.com/w40/${iso}.png" alt="${abbr}" class="team-logo flag-img" onerror="this.style.display='none'">`;
  }
  // Generic ESPN country logo fallback
  const src = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/${a}.png&h=40&w=40`;
  return `<img src="${src}" alt="${abbr}" class="team-logo" onerror="this.style.display='none'">`;
}

// ── NHL GAME ID MAP ───────────────────────────────────────────
// "YYYY-MM-DD|OPP_ABBR" → game ID  — add entries as needed
const NHL_GAME_ID_MAP = {
  "2026-04-23|BUF":"2025030113",
  "2026-04-21|BUF":"2025030112",
  "2026-04-19|BUF":"2025030111",
  "2026-04-17|BUF":"2025030114",
  "2026-04-26|BUF":"2025030115",
  "2026-04-28|BUF":"2025030116",
};

// ── NHL ARENA LOCATIONS ───────────────────────────────────────
const NHL_ARENAS = [
  { abbr:"ANA", team:"Anaheim Ducks",         arena:"Honda Center",             lat:33.8078,  lng:-117.8765 },
  { abbr:"BOS", team:"Boston Bruins",          arena:"TD Garden",                lat:42.3662,  lng:-71.0621  },
  { abbr:"BUF", team:"Buffalo Sabres",         arena:"KeyBank Center",           lat:42.8750,  lng:-78.8764  },
  { abbr:"CGY", team:"Calgary Flames",         arena:"Scotiabank Saddledome",    lat:51.0374,  lng:-114.0519 },
  { abbr:"CAR", team:"Carolina Hurricanes",    arena:"PNC Arena",                lat:35.8033,  lng:-78.7217  },
  { abbr:"CHI", team:"Chicago Blackhawks",     arena:"United Center",            lat:41.8807,  lng:-87.6742  },
  { abbr:"COL", team:"Colorado Avalanche",     arena:"Ball Arena",               lat:39.7486,  lng:-105.0077 },
  { abbr:"CBJ", team:"Columbus Blue Jackets",  arena:"Nationwide Arena",         lat:39.9690,  lng:-83.0061  },
  { abbr:"DAL", team:"Dallas Stars",           arena:"American Airlines Center", lat:32.7905,  lng:-96.8103  },
  { abbr:"DET", team:"Detroit Red Wings",      arena:"Little Caesars Arena",     lat:42.3411,  lng:-83.0548  },
  { abbr:"EDM", team:"Edmonton Oilers",        arena:"Rogers Place",             lat:53.5469,  lng:-113.4977 },
  { abbr:"FLA", team:"Florida Panthers",       arena:"Amerant Bank Arena",       lat:26.1584,  lng:-80.3256  },
  { abbr:"LAK", team:"Los Angeles Kings",      arena:"Crypto.com Arena",         lat:34.0430,  lng:-118.2673 },
  { abbr:"MIN", team:"Minnesota Wild",         arena:"Xcel Energy Center",       lat:44.9447,  lng:-93.1013  },
  { abbr:"MTL", team:"Montreal Canadiens",     arena:"Bell Centre",              lat:45.4961,  lng:-73.5694  },
  { abbr:"NSH", team:"Nashville Predators",    arena:"Bridgestone Arena",        lat:36.1591,  lng:-86.7785  },
  { abbr:"NJD", team:"New Jersey Devils",      arena:"Prudential Center",        lat:40.7334,  lng:-74.1712,  wiki:"Prudential_Center"              },
  { abbr:"NYI", team:"New York Islanders",     arena:"UBS Arena",                lat:40.7219,  lng:-73.7230  },
  { abbr:"NYR", team:"New York Rangers",       arena:"Madison Square Garden",    lat:40.7505,  lng:-73.9934  },
  { abbr:"OTT", team:"Ottawa Senators",        arena:"Canadian Tire Centre",     lat:45.2967,  lng:-75.9280  },
  { abbr:"PHI", team:"Philadelphia Flyers",    arena:"Xfinity Mobile Arena",     lat:39.9012,  lng:-75.1720,  wiki:"Wells_Fargo_Center_(Philadelphia)" },
  { abbr:"PIT", team:"Pittsburgh Penguins",    arena:"PPG Paints Arena",         lat:40.4395,  lng:-79.9893  },
  { abbr:"SJS", team:"San Jose Sharks",        arena:"SAP Center",               lat:37.3327,  lng:-121.9008 },
  { abbr:"SEA", team:"Seattle Kraken",         arena:"Climate Pledge Arena",     lat:47.6222,  lng:-122.3542 },
  { abbr:"STL", team:"St. Louis Blues",        arena:"Enterprise Center",        lat:38.6267,  lng:-90.2025,  wiki:"Enterprise_Center"              },
  { abbr:"TBL", team:"Tampa Bay Lightning",    arena:"Amalie Arena",             lat:27.9428,  lng:-82.4519  },
  { abbr:"TOR", team:"Toronto Maple Leafs",    arena:"Scotiabank Arena",         lat:43.6435,  lng:-79.3791  },
  { abbr:"UTA", team:"Utah Mammoth",            arena:"Delta Center",             lat:40.7683,  lng:-111.9011, wiki:"Delta_Center"                   },
  { abbr:"VAN", team:"Vancouver Canucks",      arena:"Rogers Arena",             lat:49.2778,  lng:-123.1088 },
  { abbr:"VGK", team:"Vegas Golden Knights",   arena:"T-Mobile Arena",           lat:36.1028,  lng:-115.1781 },
  { abbr:"WSH", team:"Washington Capitals",    arena:"Capital One Arena",        lat:38.8981,  lng:-77.0209  },
  { abbr:"WPG", team:"Winnipeg Jets",          arena:"Canada Life Centre",       lat:49.8928,  lng:-97.1434  },
];

const ABBR_TO_TEAM = Object.fromEntries(NHL_ARENAS.map(a => [a.abbr, a.team]));
function teamFullName(abbr) { return ABBR_TO_TEAM[abbr?.toUpperCase()] || abbr || "Unknown"; }

const OPP_TO_ABBR = {
  "Buffalo":"BUF","Buffalo Sabres":"BUF","Toronto":"TOR","Toronto Maple Leafs":"TOR",
  "Montreal":"MTL","Montreal Canadiens":"MTL","Ottawa":"OTT","Ottawa Senators":"OTT",
  "Detroit":"DET","Detroit Red Wings":"DET","Tampa Bay":"TBL","Tampa Bay Lightning":"TBL",
  "Florida":"FLA","Florida Panthers":"FLA","Carolina":"CAR","Carolina Hurricanes":"CAR",
  "New Jersey":"NJD","New Jersey Devils":"NJD","NY Rangers":"NYR","New York Rangers":"NYR",
  "NY Islanders":"NYI","New York Islanders":"NYI","Philadelphia":"PHI","Philadelphia Flyers":"PHI",
  "Pittsburgh":"PIT","Pittsburgh Penguins":"PIT","Washington":"WSH","Washington Capitals":"WSH",
  "Columbus":"CBJ","Columbus Blue Jackets":"CBJ","Nashville":"NSH","Nashville Predators":"NSH",
  "Winnipeg":"WPG","Winnipeg Jets":"WPG","Minnesota":"MIN","Minnesota Wild":"MIN",
  "Chicago":"CHI","Chicago Blackhawks":"CHI","St. Louis":"STL","St Louis Blues":"STL",
  "Colorado":"COL","Colorado Avalanche":"COL","Dallas":"DAL","Dallas Stars":"DAL",
  "Arizona":"ARI","Utah":"UTA","Vegas":"VGK","Vegas Golden Knights":"VGK",
  "Seattle":"SEA","Seattle Kraken":"SEA","Vancouver":"VAN","Vancouver Canucks":"VAN",
  "Calgary":"CGY","Calgary Flames":"CGY","Edmonton":"EDM","Edmonton Oilers":"EDM",
  "Anaheim":"ANA","Anaheim Ducks":"ANA","Los Angeles":"LAK","LA Kings":"LAK","Los Angeles Kings":"LAK",
  "San Jose":"SJS","San Jose Sharks":"SJS",
};

function resolveGameId(g) {
  const abbr = OPP_TO_ABBR[g.opponent] || "";
  const date = normaliseDateStr(g.date) || "";
  return NHL_GAME_ID_MAP[`${date}|${abbr}`] || null;
}

function gamecenterUrl(g, gameId) {
  const id   = gameId || g._resolvedGameId || "0";
  const abbr = (OPP_TO_ABBR[g.opponent] || "opp").toLowerCase();
  const date = g.date ? g.date.slice(0, 10).replace(/-/g, "/") : "";
  const ha   = g.homeAway === "Home" ? `${abbr}-vs-bos` : `bos-vs-${abbr}`;
  return `https://www.nhl.com/gamecenter/${ha}/${date}/${id}`;
}

// ── STATE ─────────────────────────────────────────────────────
let ALL_GAMES = [];
let activeFilters = { homeAway: "All", seasonType: "All", season: [] };
let seasonDropdownOpen = false;

const SORT = {
  opp:    { col: "gp",     dir: "desc" },
  att:    { col: "gp",     dir: "desc" },
  season: { col: "season", dir: "desc" },
};

let expandOv     = null;  // overview row index
let expandOpp    = null;  // opponent name
let expandAtt    = null;  // attendee name
let expandSeason = null;  // season string
let expandGdWin  = null;  // gd wins index
let expandGdLoss = null;  // gd losses index
let expandGl     = null;  // game log row index
let expandSp     = null;  // special events row index

let mapInstance   = null;
let mapMarkers    = [];
let markersByAbbr = {};
let mapAutoOpened = false;
let selectedArena = null;
let expandMapGl   = null;

let playerStatsFetched  = false;
let playerStatsLoading  = false;
let psPosition          = "skater"; // "skater" | "goalie"
let psFilter            = "all";    // "all" | "bos" | "opp" (preset; ignored when psTeamFilter non-empty)
let psTeamFilter        = new Set(); // specific team abbrs; empty = use psFilter preset
let psDropdownBuilt     = false;
let psSortCol           = "pts";
let psSortDir           = "desc";
let psGoalieSortCol     = "w";
let psGoalieSortDir     = "desc";
let psExpanded          = new Set(); // set of player names that are expanded (multi-team)

const nhlCache    = {};  // unused — kept for compat
const gameIdCache = {};  // unused — kept for compat

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupFilterDelegation();
  loadData();
});

// Navigate to Game Log when a sub-table date is clicked
document.addEventListener("click", e => {
  const btn = e.target.closest(".sub-date-nav");
  if (!btn) return;
  navigateToGameLog(btn.dataset.navDate);
});

function setupTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "tab-map") {
        renderMap(filteredGames(false));
        if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 50);
      }
      if (btn.dataset.tab === "tab-playerstats") {
        renderPlayerStats(filteredGames(false));
      }
    });
  });
}

// Single delegated filter listener — attached once, works regardless of DOM rerenders.
// Any .pill[data-filter] click anywhere on the page is caught here.
function setupFilterDelegation() {
  document.addEventListener("click", e => {
    const pill = e.target.closest(".pill[data-filter]");
    if (!pill) return;
    const { group, filter: val } = pill.dataset;
    if (!group || !val) return;
    // Update active class on all pills sharing this group
    document.querySelectorAll(`.pill[data-group="${group}"]`).forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilters[group] = val;
    if (group === "homeAway" || group === "seasonType") {
      const avail = availableSeasons();
      activeFilters.season = activeFilters.season.filter(s => avail.includes(s));
    }
    renderAll();
  });

  // Season dropdown toggle + outside-click close
  document.addEventListener("click", e => {
    if (e.target.closest(".season-dd-trigger")) {
      seasonDropdownOpen = !seasonDropdownOpen;
      renderAll();
      return;
    }
    if (!e.target.closest(".season-dd-wrap") && seasonDropdownOpen) {
      seasonDropdownOpen = false;
      renderAll();
    }
  });

  // Season checkbox change
  document.addEventListener("change", e => {
    const cb = e.target.closest(".season-dd-check");
    if (!cb) return;
    const val = cb.value;
    if (val === "__all__") {
      activeFilters.season = [];
    } else {
      const idx = activeFilters.season.indexOf(val);
      if (idx === -1) activeFilters.season.push(val);
      else            activeFilters.season.splice(idx, 1);
    }
    renderAll();
  });
}

// ── DATA ──────────────────────────────────────────────────────
async function loadData() {
  setLoading(true);
  try {
    const res  = await fetch("/.netlify/functions/fetch-games");
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    const raw = Array.isArray(json) ? json : json.games;
    if (!Array.isArray(raw)) throw new Error("Unexpected data format.");
    ALL_GAMES = normalizeGames(raw);
    renderAll();
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function normalizeGames(raw) {
  return raw.map(r => {
    const out = (r[COL.outcome] || "").trim().toUpperCase();
    let result = "T";
    if      (out === "WIN"  || out === "W")                          result = "W";
    else if (out === "LOSS" || out === "L")                          result = "L";
    else if (out === "OTL"  || out === "OT LOSS" || out === "OT L") result = "OTL";
    return {
      date:         r[COL.date]        || "",
      opponent:     r[COL.opponent]    || "",
      homeAway:     (r[COL.homeAway]   || "").trim(),
      seasonType:   (r[COL.seasonType] || "").trim(),
      season:       (r[COL.season]     || "").trim(),
      goalsFor:     parseInt(r[COL.goalsFor],     10) || 0,
      goalsAgainst: parseInt(r[COL.goalsAgainst], 10) || 0,
      result,
      guests: (r[COL.guest] || "").split(",").map(a => a.trim()).filter(Boolean),
      notes:  r[COL.notes] || "",
      playoffRound: (r[COL.playoffRound] || "").trim(),
      playoffGame:  (r[COL.playoffGame]  || "").trim(),
      spHomeScore: r[COL.spHomeScore] || "",
      spAwayScore: r[COL.spAwayScore] || "",
      spHomeTeam:  r[COL.spHomeTeam]  || "",
      spAwayTeam:  r[COL.spAwayTeam]  || "",
      spOvertime:  (r[COL.spOvertime] || "").trim(),
    };
  }).filter(g => g.date && g.opponent);
}

// ── FILTER ────────────────────────────────────────────────────
function filteredGames(includeSpecial = false) {
  return ALL_GAMES.filter(g => {
    const isSp = g.seasonType.toLowerCase() === "special";
    if (!includeSpecial && isSp)  return false;
    if (includeSpecial  && !isSp) return false;
    if (!includeSpecial) {
      if (activeFilters.homeAway   !== "All" && g.homeAway   !== activeFilters.homeAway)   return false;
      if (activeFilters.seasonType !== "All" && g.seasonType !== activeFilters.seasonType) return false;
      if (activeFilters.season.length > 0 && !activeFilters.season.includes(g.season))    return false;
    }
    return true;
  });
}

function uniqueSeasons() {
  const s = new Set(ALL_GAMES.filter(g => g.season).map(g => g.season));
  return [...s].sort((a, b) => b.localeCompare(a));
}

function availableSeasons() {
  const s = new Set(
    ALL_GAMES.filter(g => {
      if (g.seasonType.toLowerCase() === "special") return false;
      if (activeFilters.homeAway   !== "All" && g.homeAway   !== activeFilters.homeAway)   return false;
      if (activeFilters.seasonType !== "All" && g.seasonType !== activeFilters.seasonType) return false;
      return !!g.season;
    }).map(g => g.season)
  );
  return [...s].sort((a, b) => b.localeCompare(a));
}


function navigateToGameLog(isoDate) {
  // Reset filters so the target game is always visible
  activeFilters = { homeAway: "All", seasonType: "All", season: [] };
  seasonDropdownOpen = false;
  document.querySelectorAll(".pill[data-group]").forEach(p => {
    p.classList.toggle("active", p.dataset.filter === "All");
  });

  // Switch to game log tab
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector("[data-tab='tab-gamelog']")?.classList.add("active");
  document.getElementById("tab-gamelog")?.classList.add("active");

  // Find the row index in the sorted game log and expand it
  const sorted = [...filteredGames(false)].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx    = sorted.findIndex(g => normaliseDateStr(g.date) === isoDate);
  if (idx !== -1) expandGl = idx;

  renderGameLog(filteredGames(false));

  // Scroll expanded row into view after render
  if (idx !== -1) {
    setTimeout(() => {
      document.getElementById(`gl-panel-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
}

function renderAll() {
  const games   = filteredGames(false);
  const special = filteredGames(true);
  renderOverview(games);
  renderGameLog(games);
  renderOpponents(games);
  renderGoalDiff(games);
  renderMap(games);
  renderAttendees(games);
  renderSeasons(games);
  renderSpecial(special);
  if (playerStatsFetched) renderPlayerStats(games);
}

// ── HELPERS ───────────────────────────────────────────────────
const isLoss = r => r === "L" || r === "OTL";

function record(games) {
  return {
    w:   games.filter(g => g.result === "W").length,
    l:   games.filter(g => g.result === "L").length,
    otl: games.filter(g => g.result === "OTL").length,
    gp:  games.length,
  };
}

const winPct    = rec => !rec.gp ? "—" : ((rec.w / rec.gp) * 100).toFixed(1) + "%";
const pointsPct = rec => !rec.gp ? "—" : (((rec.w * 2 + rec.otl) / (rec.gp * 2)) * 100).toFixed(1) + "%";
const avgGoals  = (games, key) => !games.length ? "—" : (games.reduce((s, g) => s + g[key], 0) / games.length).toFixed(2);
const totalGoals = (games, key) => games.reduce((s, g) => s + g[key], 0);
const resultBadge = r => `<span class="badge badge-${r === "W" ? "W" : isLoss(r) ? "L" : "T"}">${r}</span>`;
const fmtDate = str => { if (!str) return "—"; const d = new Date(str); return isNaN(d) ? str : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
const extractSeason = s => { if (!s) return "Unknown"; const d = new Date(s), y = d.getFullYear(), m = d.getMonth(); return m >= 9 ? `${y}–${String(y+1).slice(2)}` : `${y-1}–${String(y).slice(2)}`; };

function filterPillsHTML() {
  const ha = activeFilters.homeAway, st = activeFilters.seasonType;
  const sel = activeFilters.season;
  const seasons = availableSeasons();
  const label = sel.length === 0 ? "All Seasons"
    : sel.length === 1 ? sel[0]
    : `${sel.length} Seasons`;
  const allItem = `<label class="season-dd-item season-dd-all">
      <input type="checkbox" class="season-dd-check" value="__all__"${sel.length === 0 ? " checked" : ""}>
      <span>All Seasons</span>
    </label><div class="season-dd-divider"></div>`;
  const items = seasons.map(s =>
    `<label class="season-dd-item">
      <input type="checkbox" class="season-dd-check" value="${s}"${sel.includes(s) ? " checked" : ""}>
      <span>${s}</span>
    </label>`
  ).join("");
  return `<div class="filters">
    <span class="filter-label">Location:</span>
    ${["All","Home","Away"].map(v => `<button class="pill${ha===v?" active":""}" data-filter="${v}" data-group="homeAway">${v}</button>`).join("")}
    <span class="filter-label" style="margin-left:1rem">Game Type:</span>
    ${["All","Regular","Playoffs","Preseason"].map(v => `<button class="pill${st===v?" active":""}" data-filter="${v}" data-group="seasonType">${v}</button>`).join("")}
    <span class="filter-label" style="margin-left:1rem">Season:</span>
    <div class="season-dd-wrap${seasonDropdownOpen ? " dd-open" : ""}">
      <button class="pill season-dd-trigger${sel.length > 0 ? " active" : ""}">${label} <span class="chevron">▾</span></button>
      <div class="season-dd-panel${seasonDropdownOpen ? " open" : ""}">${allItem}${items}</div>
    </div>
  </div>`;
}

function sortHeader(key, col, label) {
  const s = SORT[key]; if (!s) return `<th>${label}</th>`;
  const on = s.col === col;
  return `<th data-sort-table="${key}" data-sort-col="${col}" class="sortable${on?" sort-active":""}">${label}${on?(s.dir==="asc"?" ↑":" ↓"):""}</th>`;
}

function attachSortListeners() {
  document.querySelectorAll("th[data-sort-table]").forEach(th => {
    const f = th.cloneNode(true); th.replaceWith(f);
    f.addEventListener("click", () => {
      const { sortTable: k, sortCol: c } = f.dataset;
      SORT[k] = { col: c, dir: SORT[k].col === c && SORT[k].dir === "desc" ? "asc" : "desc" };
      renderAll();
    });
  });
}

function sortRows(rows, key, colMap) {
  const s = SORT[key]; if (!s) return rows;
  const fn = colMap[s.col]; if (!fn) return rows;
  return [...rows].sort((a, b) => {
    const av = fn(a), bv = fn(b);
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return s.dir === "asc" ? cmp : -cmp;
  });
}

// ── ESPN API (via Netlify proxy — no CORS issues) ─────────────
// Static map of known ESPN game IDs: "YYYY-MM-DD" → espn event id
const ESPN_GAME_ID_MAP = {
  "2026-04-23": "401869759",   // BUF @ BOS  Apr 23 2026 (R1G3)
  "2025-02-20": "401688921",   // 4 Nations Face-Off Final: CAN vs USA
  // Add future special-event ESPN game IDs here keyed by "YYYY-MM-DD"
};

const espnCache = {};  // "YYYY-MM-DD" → normalised game data from our proxy

function normaliseDateStr(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const d = new Date(s);
  if (!isNaN(d)) {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  }
  return null;
}

// Call our local/Netlify function which proxies NHL/ESPN server-side
async function fetchEspnGame(g) {
  const dateStr = normaliseDateStr(g.date);
  if (!dateStr) return null;

  if (espnCache[dateStr]) return espnCache[dateStr];

  const nhlGameId = resolveGameId(g);
  const knownId   = ESPN_GAME_ID_MAP[dateStr];

  const parts = [];
  if (nhlGameId) parts.push(`nhlGameId=${nhlGameId}`);
  if (knownId)   parts.push(`eventId=${knownId}`);
  parts.push(`date=${dateStr.replace(/-/g, "")}`);

  try {
    const res = await fetch(`/.netlify/functions/espn-game?${parts.join("&")}`);
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    console.log("[ESPN] stars:", data.stars?.length, data.stars?.map(s => s.name));
    console.log("[ESPN] teamStats:", data.teamStats?.length, data.teamStats?.map(s => s.label));
    console.log("[ESPN] scoringPlays:", data.scoringPlays?.length);
    espnCache[dateStr] = data;
    return data;
  } catch (err) {
    console.error("[game proxy] failed:", err);
    return null;
  }
}

// Top-level loader called from game log expand
async function loadNhlDetailForGame(g, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const dateStr = normaliseDateStr(g.date) || String(g.date);
  panel.innerHTML = `<div class="nhl-loading">Loading game data for ${dateStr}…</div>`;

  const data = await fetchEspnGame(g);
  const p = document.getElementById(panelId);
  if (!p) return;

  if (!data) {
    p.innerHTML = `<div class="nhl-error">No game data found for ${dateStr}.</div>`;
    return;
  }
  renderEspnDetail(p, data, g);
}

// ── ESPN RENDER ───────────────────────────────────────────────
function renderEspnDetail(panel, data, g) {
  const { score, periods, scoringPlays, stars, teamStats } = data;
  const espnUrl = data.eventId
    ? `https://www.espn.com/nhl/game/_/gameId/${data.eventId}`
    : `https://www.espn.com/nhl/scoreboard`;
  const isSpecial = (g.seasonType || "").toLowerCase() === "special";
  const eventLabel = isSpecial && g.notes ? g.notes : (isSpecial ? "Special Event" : "");

  // Period breakdown
  const periodHTML = (periods || []).map(p => {
    const an = parseInt(p.away) || 0, hn = parseInt(p.home) || 0;
    return `<div class="period-row">
      <span class="period-lbl">${p.label}</span>
      <span class="period-val ${an > hn ? "win" : ""}">${p.away}</span>
      <span class="period-sep">–</span>
      <span class="period-val ${hn > an ? "win" : ""}">${p.home}</span>
    </div>`;
  }).join("");

  panel.innerHTML = `
    <div class="nhl-detail">
      ${eventLabel ? `<div class="special-event-banner">${eventLabel}</div>` : ""}
      <div class="nhl-header">
        <div class="nhl-score-block">
          <div class="nhl-team-col">
            ${abbrLogo(score.awayAbbr)}
            <div class="nhl-abbr">${score.awayAbbr}</div>
            <div class="nhl-goals">${score.awayScore}</div>
          </div>
          <div class="nhl-mid">
            <div class="nhl-final">${score.status}</div>
            ${periodHTML ? `<div class="period-breakdown">${periodHTML}</div>` : ""}
          </div>
          <div class="nhl-team-col">
            ${abbrLogo(score.homeAbbr)}
            <div class="nhl-abbr">${score.homeAbbr}</div>
            <div class="nhl-goals">${score.homeScore}</div>
          </div>
        </div>
        <a href="${espnUrl}" target="_blank" class="nhl-ext-link">Full recap on ESPN ↗</a>
      </div>

      <div class="nhl-two-col">
        <div class="nhl-section">
          <div class="nhl-section-title">Scoring</div>
          ${buildEspnScoring(scoringPlays, score)}
        </div>
        <div class="nhl-section">
          <div class="nhl-section-title">Team Stats</div>
          ${buildTeamStats(teamStats, score)}
        </div>
        <div class="nhl-section">
          <div class="nhl-section-title">Stars of the Game</div>
          ${buildEspnStars(stars)}
        </div>
      </div>
    </div>`;
}

function buildTeamStats(teamStats, score) {
  if (!teamStats || !teamStats.length) return `<p class="nhl-empty">No team stats available.</p>`;
  const rows = teamStats.map(s => {
    const av = parseFloat(s.away), hv = parseFloat(s.home);
    const awayHi = !isNaN(av) && !isNaN(hv) && av > hv ? " stat-val-hi" : "";
    const homeHi = !isNaN(av) && !isNaN(hv) && hv > av ? " stat-val-hi" : "";
    return `<tr>
      <td class="stat-label">${s.label}</td>
      <td class="${awayHi}">${s.away}</td>
      <td class="${homeHi}">${s.home}</td>
    </tr>`;
  }).join("");
  return `<table class="team-stats-table">
    <thead><tr><th></th><th>${score.awayAbbr}</th><th>${score.homeAbbr}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildEspnStars(stars) {
  if (!stars || !stars.length) return `<p class="nhl-empty">No stars data available.</p>`;
  const labels = ["1st ⭐", "2nd ⭐", "3rd ⭐"];
  return `<div class="stars-col">${stars.slice(0, 3).map((st, i) => {
    const statLine = (st.stats || []).map(s => `${s.value} ${s.label}`).join(" · ");
    const headshot = st.headshot
      ? `<img src="${st.headshot}" class="star-headshot" alt="${st.name}" onerror="this.style.display='none'">`
      : "";
    return `<div class="star-card">
      <div class="star-card-body">
        <div>
          <div class="star-rank">${labels[i]}</div>
          <div class="star-name">${st.name || "—"}</div>
          <div class="star-meta">${st.team || ""}${st.pos ? ` · ${st.pos}` : ""}</div>
          ${statLine ? `<div class="star-stat">${statLine}</div>` : ""}
        </div>
        ${headshot}
      </div>
    </div>`;
  }).join("")}</div>`;
}

function buildEspnScoring(plays, score) {
  if (!plays || !plays.length) return `<p class="nhl-empty">No scoring data available.</p>`;
  return `<div class="scoring-log">${plays.map(play => {
    const teamAbbr  = play.team || "";
    const logo      = abbrLogo(teamAbbr);
    const shotType  = play.shotType && play.shotType !== "Goal" ? ` · ${play.shotType}` : "";
    const scoreSnap = (play.awayScore !== "" && play.homeScore !== "")
      ? `${score.awayAbbr} ${play.awayScore}–${play.homeScore} ${score.homeAbbr}` : "";
    const assistTxt = play.assists?.length
      ? `Assists: ${play.assists.join(", ")}` : "Unassisted";
    const mainLine  = play.scorer || play.text || "—";

    return `<div class="score-row">
      <span class="score-period">${play.period}</span>
      <span class="score-team-logo">${logo}</span>
      <div class="score-detail">
        <div class="score-scorer">${mainLine}${shotType}</div>
        <div class="score-assists">${assistTxt}</div>
        ${scoreSnap ? `<div class="score-snap">${scoreSnap}</div>` : ""}
      </div>
      <span class="score-time">${play.time}</span>
    </div>`;
  }).join("")}</div>`;
}


function buildSubList(games, opts) {
  const { showOpponent = false, showGuest = false } = opts || {};
  if (!games?.length) {
    const cols = 3 + (showOpponent ? 1 : 0) + 3 + (showGuest ? 1 : 0);
    return `<tr><td colspan="${cols}" class="sub-empty">No games found.</td></tr>`;
  }
  return [...games].sort((a,b) => new Date(b.date)-new Date(a.date)).map(g => {
    const isoDate  = normaliseDateStr(g.date) || "";
    const dt       = `<button class="sub-date-nav" data-nav-date="${isoDate}">${fmtDate(g.date)} ↗</button>`;
    const season   = g.season || extractSeason(g.date);
    const oppCell  = showOpponent ? `<td>${teamLogo(g.opponent)}<span>${g.opponent}</span></td>` : "";
    const guestCell = showGuest   ? `<td class="dim">${g.guests.join(", ") || "—"}</td>` : "";
    return `<tr class="sub-row">
      <td class="dim">${season}</td>
      <td class="dim">${g.seasonType || "—"}</td>
      <td>${dt}</td>
      ${oppCell}
      <td>${g.homeAway==="Home"?"🏠":"✈️"} ${g.homeAway}</td>
      <td>${g.goalsFor}–${g.goalsAgainst}</td>
      <td>${resultBadge(g.result)}</td>
      ${guestCell}
    </tr>`;
  }).join("");
}

function subExpandHTML(games, colspan, opts) {
  const { showOpponent = false, showGuest = false } = opts || {};
  const oppHead   = showOpponent ? "<th>Opponent</th>" : "";
  const guestHead = showGuest    ? "<th>Guest</th>"    : "";
  return `<tr class="sub-expand-tr">
    <td colspan="${colspan}" style="padding:0">
      <div class="sub-panel">
        <table class="sub-table">
          <thead><tr><th>Season</th><th>Game Type</th><th>Date</th>${oppHead}<th>Location</th><th>Score</th><th>Result</th>${guestHead}</tr></thead>
          <tbody>${buildSubList(games, opts)}</tbody>
        </table>
      </div>
    </td>
  </tr>`;
}

// ── OVERVIEW ──────────────────────────────────────────────────
function renderOverview(games) {
  document.getElementById("ov-filters").innerHTML = filterPillsHTML();
  const rec = record(games);
  const gf  = totalGoals(games,"goalsFor"), ga = totalGoals(games,"goalsAgainst"), gd = gf-ga;

  document.getElementById("hero-record").innerHTML = `${rec.w}<span>-</span>${rec.l}<span>-</span>${rec.otl}`;
  ["ov-gp","ov-wpct","ov-ptspct","ov-gf-total","ov-ga-total","ov-gd","ov-gf-avg","ov-ga-avg"].forEach(id => {
    document.getElementById(id).textContent = ({
      "ov-gp":rec.gp, "ov-wpct":winPct(rec), "ov-ptspct":pointsPct(rec),
      "ov-gf-total":gf, "ov-ga-total":ga, "ov-gd":(gd>=0?"+":"")+gd,
      "ov-gf-avg":avgGoals(games,"goalsFor"), "ov-ga-avg":avgGoals(games,"goalsAgainst"),
    })[id];
  });

  const recent = [...games].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
  const tbody  = document.querySelector("#recent-table tbody");

  tbody.innerHTML = recent.map((g,i) => {
    const isOpen = expandOv === i;
    return `
    <tr class="main-row${isOpen?" row-open":""}">
      <td class="dim">${g.season||extractSeason(g.date)}</td>
      <td class="dim">${g.seasonType||"—"}</td>
      <td><button class="expand-date-btn" data-ov-i="${i}">${fmtDate(g.date)} <span class="chevron">▾</span></button></td>
      <td style="text-align:center">${g.homeAway==="Home"?"🏠":"✈️"}</td>
      <td>${teamLogo(g.opponent)}<span>${g.opponent}</span></td>
      <td>${g.goalsFor}–${g.goalsAgainst}</td>
      <td>${resultBadge(g.result)}</td>
      <td class="dim">${g.guests.join(", ")||"—"}</td>
    </tr>
    ${isOpen ? `<tr class="nhl-expand-tr"><td colspan="8"><div class="nhl-panel" id="ov-p-${i}"><div class="nhl-loading">Loading…</div></div></td></tr>` : ""}`;
  }).join("");

  tbody.querySelectorAll(".expand-date-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = +btn.dataset.ovI;
      expandOv = expandOv === i ? null : i;
      renderOverview(games);
    });
  });

  if (expandOv !== null && expandOv < recent.length) {
    loadNhlDetailForGame(recent[expandOv], `ov-p-${expandOv}`);
  }
}

// ── GAME LOG ──────────────────────────────────────────────────
function renderGameLog(games) {
  document.getElementById("gl-filters").innerHTML = filterPillsHTML();

  const sorted = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));

  function playoffLabel(g) {
    const r = g.playoffRound.trim(), gm = g.playoffGame.trim();
    if (!r && !gm) return "—";
    return (r ? `R${r}` : "") + (gm ? `G${gm}` : "");
  }

  const tbody = document.querySelector("#gl-table tbody");
  tbody.innerHTML = sorted.length
    ? sorted.map((g, i) => {
        const playoff = playoffLabel(g);
        const isOpen  = expandGl === i;
        return `
        <tr class="main-row gl-row${isOpen ? " row-open" : ""}" data-gl-i="${i}" style="cursor:pointer" title="Click to view game details">
          <td class="dim">${g.season || extractSeason(g.date)}</td>
          <td class="dim">${g.seasonType || "—"}</td>
          <td><span class="gl-date-btn">${fmtDate(g.date)}</span> <span class="chevron">${isOpen ? "▴" : "▾"}</span></td>
          <td style="text-align:center">${g.homeAway === "Home" ? "🏠" : "✈️"}</td>
          <td>${teamLogo(g.opponent)}<span>${g.opponent}</span></td>
          <td>${g.goalsFor}–${g.goalsAgainst}</td>
          <td>${resultBadge(g.result)}</td>
          <td class="dim">${playoff}</td>
          <td class="dim">${g.guests.join(", ") || "—"}</td>
          <td class="dim">${g.notes || "—"}</td>
        </tr>
        ${isOpen ? `<tr class="gl-expand-tr"><td colspan="10" style="padding:0"><div class="nhl-panel gl-panel" id="gl-panel-${i}"><div class="nhl-loading">Loading game data…</div></div></td></tr>` : ""}`;
      }).join("")
    : `<tr><td colspan="10" style="text-align:center;color:var(--text-dim);padding:2rem">No games found.</td></tr>`;

  // Attach row click handlers
  tbody.querySelectorAll(".gl-row").forEach(tr => {
    tr.addEventListener("click", () => {
      const i = +tr.dataset.glI;
      expandGl = expandGl === i ? null : i;
      renderGameLog(games);
    });
  });

  // Trigger NHL data load for the open row
  if (expandGl !== null && expandGl < sorted.length) {
    const g = sorted[expandGl];
    loadNhlDetailForGame(g, `gl-panel-${expandGl}`);
  }
}

// ── OPPONENTS ─────────────────────────────────────────────────
function renderOpponents(games) {
  document.getElementById("opp-filters").innerHTML = filterPillsHTML();

  const map = {};
  games.forEach(g => { (map[g.opponent] = map[g.opponent]||[]).push(g); });

  const raw = Object.entries(map).map(([opp, gs]) => {
    const rec = record(gs);
    const gd  = gs.reduce((s,g)=>s+(g.goalsFor-g.goalsAgainst),0);
    return { opp, gs, rec, gd, gp:gs.length, agd:gd/gs.length, wpct:rec.gp?rec.w/rec.gp:0 };
  });

  const CM = { opp:r=>r.opp, gp:r=>r.gp, w:r=>r.rec.w, l:r=>r.rec.l, otl:r=>r.rec.otl, wpct:r=>r.wpct, gd:r=>r.gd, agd:r=>r.agd };
  const rows = sortRows(raw, "opp", CM);

  document.querySelector("#opp-table thead tr").innerHTML =
    ["opp","gp","w","l","otl","wpct","gd","agd"].map((c,_,a) =>
      sortHeader("opp",c,{opp:"Opponent",gp:"GP",w:"W",l:"L",otl:"OTL",wpct:"Win %",gd:"Goal Diff",agd:"Avg GD"}[c])
    ).join("");

  document.querySelector("#opp-table tbody").innerHTML = rows.map(({opp,gs,rec,gd,gp,agd}) => {
    const isOpen = expandOpp === opp;
    return `
    <tr class="main-row expandable${isOpen?" row-open":""}">
      <td><button class="expand-row-btn opp-btn" data-opp="${opp}">${teamLogo(opp)}<strong>${opp}</strong> <span class="chevron">▾</span></button></td>
      <td>${gp}</td>
      <td class="win">${rec.w}</td><td class="loss">${rec.l}</td><td class="ot">${rec.otl}</td>
      <td>${winPct(rec)}</td>
      <td class="${gd>=0?"win":"loss"}">${gd>=0?"+":""}${gd}</td>
      <td class="${agd>=0?"win":"loss"}">${(agd>=0?"+":"")+agd.toFixed(2)}</td>
    </tr>
    ${isOpen ? subExpandHTML(gs, 8, { showGuest: true }) : ""}`;
  }).join("");

  document.querySelector("#opp-table tbody").querySelectorAll(".opp-btn").forEach(btn => {
    btn.addEventListener("click", () => { expandOpp = expandOpp===btn.dataset.opp?null:btn.dataset.opp; renderOpponents(games); });
  });
  attachSortListeners();
}

function computeStreaks(games) {
  const sorted = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  let longestW = 0, longestL = 0, curW = 0, curL = 0;
  for (const g of sorted) {
    if (g.result === "W") {
      curW++; curL = 0;
      if (curW > longestW) longestW = curW;
    } else {
      curL++; curW = 0;
      if (curL > longestL) longestL = curL;
    }
  }
  // Current streak: walk backwards from most recent
  let curType = null, curCount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const isW = sorted[i].result === "W";
    if (curType === null) { curType = isW ? "W" : "L"; curCount = 1; }
    else if ((curType === "W") === isW) curCount++;
    else break;
  }
  return {
    longestW,
    longestL,
    current: sorted.length ? `${curType}${curCount}` : "—",
  };
}

// ── GOAL DIFFERENTIAL ─────────────────────────────────────────
function renderGoalDiff(games) {
  document.getElementById("gd-filters").innerHTML = filterPillsHTML();

  const gds = games.map(g=>g.goalsFor-g.goalsAgainst);
  const avg = gds.length ? gds.reduce((a,b)=>a+b,0)/gds.length : 0;
  const streaks = computeStreaks(games);

  document.getElementById("gd-avg").textContent       = avg>=0 ? `+${avg.toFixed(2)}` : avg.toFixed(2);
  document.getElementById("gd-max").textContent       = gds.length ? `+${Math.max(...gds)}` : "—";
  document.getElementById("gd-min").textContent       = gds.length ? Math.min(...gds) : "—";
  document.getElementById("gd-positive").textContent  = gds.filter(d=>d>0).length;
  document.getElementById("gd-negative").textContent  = gds.filter(d=>d<0).length;
  document.getElementById("gd-one-win").textContent   = games.filter(g=>Math.abs(g.goalsFor-g.goalsAgainst)===1&&g.result==="W").length;
  document.getElementById("gd-one-loss").textContent  = games.filter(g=>Math.abs(g.goalsFor-g.goalsAgainst)===1&&isLoss(g.result)).length;
  document.getElementById("gd-streak-w").textContent  = streaks.longestW || "—";
  document.getElementById("gd-streak-l").textContent  = streaks.longestL || "—";
  document.getElementById("gd-streak-cur").textContent = streaks.current;

  renderGDChart(games);

  const wins   = [...games].filter(g=>g.result==="W").sort((a,b)=>(b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst)).slice(0,5);
  const losses = [...games].filter(g=>isLoss(g.result)).sort((a,b)=>(a.goalsFor-a.goalsAgainst)-(b.goalsFor-b.goalsAgainst)).slice(0,5);
  const blank  = n => `<tr><td colspan="${n}" class="dim" style="text-align:center;padding:1rem">—</td></tr>`;

  const makeGdRows = (list, openState, panelPfx) => list.length ? list.map((g,i) => {
    const gd = g.goalsFor-g.goalsAgainst, isOpen = openState===i;
    return `
    <tr class="main-row${isOpen?" row-open":""}">
      <td><button class="expand-date-btn gd-btn" data-pfx="${panelPfx}" data-i="${i}">${fmtDate(g.date)} <span class="chevron">▾</span></button></td>
      <td>${teamLogo(g.opponent)}<span>${g.opponent}</span></td>
      <td>${g.goalsFor}–${g.goalsAgainst}</td>
      <td class="${gd>=0?"win":"loss"}">${gd>=0?"+":""}${gd}</td>
    </tr>
    ${isOpen?`<tr class="nhl-expand-tr"><td colspan="4"><div class="nhl-panel" id="${panelPfx}-${i}"><div class="nhl-loading">Loading…</div></div></td></tr>`:""}`;
  }).join("") : blank(4);

  document.querySelector("#gd-wins-table tbody").innerHTML = makeGdRows(wins, expandGdWin, "gdw");
  document.querySelector("#gd-loss-table tbody").innerHTML = makeGdRows(losses, expandGdLoss, "gdl");

  document.querySelectorAll(".gd-btn[data-pfx='gdw']").forEach(btn => {
    btn.addEventListener("click", () => { const i=+btn.dataset.i; expandGdWin=expandGdWin===i?null:i; renderGoalDiff(games); });
  });
  document.querySelectorAll(".gd-btn[data-pfx='gdl']").forEach(btn => {
    btn.addEventListener("click", () => { const i=+btn.dataset.i; expandGdLoss=expandGdLoss===i?null:i; renderGoalDiff(games); });
  });

  if (expandGdWin  !== null && expandGdWin  < wins.length)   loadNhlDetailForGame(wins[expandGdWin],   `gdw-${expandGdWin}`);
  if (expandGdLoss !== null && expandGdLoss < losses.length) loadNhlDetailForGame(losses[expandGdLoss], `gdl-${expandGdLoss}`);
}

function renderGDChart(games) {
  const ctx = document.getElementById("gd-chart");
  if (!ctx) return;
  if (ctx._chartInstance) ctx._chartInstance.destroy();
  if (!games.length) return;

  const sorted = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumGF = 0, cumGA = 0;
  const labels = [], dataGF = [], dataGA = [];
  sorted.forEach((g, i) => {
    cumGF += g.goalsFor;
    cumGA += g.goalsAgainst;
    labels.push(fmtDate(g.date));
    dataGF.push(cumGF);
    dataGA.push(cumGA);
  });

  const gridColor = "rgba(255,255,255,0.05)";
  const tickColor = "#888";
  ctx._chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Goals For",
          data: dataGF,
          borderColor: "rgba(255,184,28,0.9)",
          backgroundColor: "rgba(255,184,28,0.08)",
          fill: true,
          tension: 0.3,
          pointRadius: sorted.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: "Goals Against",
          data: dataGA,
          borderColor: "rgba(122,173,255,0.75)",
          backgroundColor: "rgba(122,173,255,0.06)",
          fill: true,
          tension: 0.3,
          pointRadius: sorted.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#aaa", boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            afterBody: items => {
              const gf = items.find(i => i.dataset.label === "Goals For")?.parsed.y ?? 0;
              const ga = items.find(i => i.dataset.label === "Goals Against")?.parsed.y ?? 0;
              const diff = gf - ga;
              return [`Differential: ${diff >= 0 ? "+" : ""}${diff}`];
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: tickColor, maxTicksLimit: 10, maxRotation: 30 }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
      },
    },
  });
}

// ── ATTENDEES ─────────────────────────────────────────────────
function renderAttendees(games) {
  document.getElementById("att-filters").innerHTML = filterPillsHTML();

  const map = {};
  games.forEach(g => {
    const people = g.guests.length ? g.guests : ["Solo"];
    people.forEach(p => { (map[p] = map[p]||[]).push(g); });
  });

  const raw = Object.entries(map).map(([name,gs]) => {
    const rec = record(gs);
    const gd  = gs.reduce((s,g)=>s+(g.goalsFor-g.goalsAgainst),0);
    return { name, gs, rec, gd, gp:gs.length, wpct:rec.gp?rec.w/rec.gp:0 };
  });

  const CM = { name:r=>r.name, gp:r=>r.gp, w:r=>r.rec.w, l:r=>r.rec.l, otl:r=>r.rec.otl, wpct:r=>r.wpct, gd:r=>r.gd };
  const rows = sortRows(raw, "att", CM);

  document.querySelector("#att-table thead tr").innerHTML =
    ["name","gp","w","l","otl","wpct","gd"].map(c =>
      sortHeader("att",c,{name:"Guest",gp:"GP",w:"W",l:"L",otl:"OTL",wpct:"Win %",gd:"Total GD"}[c])
    ).join("");

  document.querySelector("#att-table tbody").innerHTML = rows.map(({name,gs,rec,gd,gp}) => {
    const isOpen = expandAtt === name;
    return `
    <tr class="main-row expandable${isOpen?" row-open":""}">
      <td><button class="expand-row-btn att-btn" data-att="${name}"><strong>${name}</strong> <span class="chevron">▾</span></button></td>
      <td>${gp}</td>
      <td class="win">${rec.w}</td><td class="loss">${rec.l}</td><td class="ot">${rec.otl}</td>
      <td>${winPct(rec)}</td>
      <td class="${gd>=0?"win":"loss"}">${gd>=0?"+":""}${gd}</td>
    </tr>
    ${isOpen ? subExpandHTML(gs, 7, { showOpponent: true, showGuest: true }) : ""}`;
  }).join("");

  document.querySelector("#att-table tbody").querySelectorAll(".att-btn").forEach(btn => {
    btn.addEventListener("click", () => { expandAtt = expandAtt===btn.dataset.att?null:btn.dataset.att; renderAttendees(games); });
  });

  renderAttChart(rows);
  attachSortListeners();
}

function renderAttChart(rows) {
  const ctx = document.getElementById("att-chart");
  if (!ctx) return;
  if (ctx._chartInstance) ctx._chartInstance.destroy();
  ctx._chartInstance = new Chart(ctx, {
    type:"bar",
    data:{ labels:rows.map(r=>r.name), datasets:[
      { label:"W",   data:rows.map(r=>r.rec.w),   backgroundColor:"rgba(76,175,125,0.75)",  borderRadius:4 },
      { label:"L",   data:rows.map(r=>r.rec.l),   backgroundColor:"rgba(224,82,82,0.75)",   borderRadius:4 },
      { label:"OTL", data:rows.map(r=>r.rec.otl), backgroundColor:"rgba(255,140,0,0.75)",   borderRadius:4 },
    ]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ labels:{color:"#888",boxWidth:12} } },
      scales:{
        x:{stacked:true,ticks:{color:"#888"},grid:{color:"rgba(255,255,255,0.05)"}},
        y:{stacked:true,ticks:{color:"#888",stepSize:1},grid:{color:"rgba(255,255,255,0.05)"}}
      }
    },
  });
}

// ── SEASONS ───────────────────────────────────────────────────
function renderSeasons(games) {
  document.getElementById("season-filters").innerHTML = filterPillsHTML();

  const map = {};
  games.forEach(g => { const yr=g.season||extractSeason(g.date); (map[yr]=map[yr]||[]).push(g); });

  const raw = Object.entries(map).map(([season,gs]) => {
    const rec=record(gs), gf=totalGoals(gs,"goalsFor"), ga=totalGoals(gs,"goalsAgainst");
    return { season, gs, rec, gf, ga, gp:gs.length, wpct:rec.gp?rec.w/rec.gp:0 };
  });

  const CM = { season:r=>r.season, gp:r=>r.gp, w:r=>r.rec.w, l:r=>r.rec.l, otl:r=>r.rec.otl, wpct:r=>r.wpct, gf:r=>r.gf, ga:r=>r.ga, gd:r=>r.gf-r.ga };
  const rows = sortRows(raw, "season", CM);

  document.querySelector("#season-table thead tr").innerHTML =
    ["season","gp","w","l","otl","wpct","gf","ga","gd"].map(c =>
      sortHeader("season",c,{season:"Season",gp:"GP",w:"W",l:"L",otl:"OTL",wpct:"Win %",gf:"GF",ga:"GA",gd:"GD"}[c])
    ).join("");

  document.querySelector("#season-table tbody").innerHTML = rows.map(({season,gs,rec,gf,ga,gp}) => {
    const gd=gf-ga, isOpen=expandSeason===season;
    return `
    <tr class="main-row expandable${isOpen?" row-open":""}">
      <td><button class="expand-row-btn season-btn" data-season="${season}"><strong>${season}</strong> <span class="chevron">▾</span></button></td>
      <td>${gp}</td>
      <td class="win">${rec.w}</td><td class="loss">${rec.l}</td><td class="ot">${rec.otl}</td>
      <td>${winPct(rec)}</td>
      <td>${gf}</td><td>${ga}</td>
      <td class="${gd>=0?"win":"loss"}">${gd>=0?"+":""}${gd}</td>
    </tr>
    ${isOpen ? subExpandHTML(gs, 9, { showOpponent: true, showGuest: true }) : ""}`;
  }).join("");

  document.querySelector("#season-table tbody").querySelectorAll(".season-btn").forEach(btn => {
    btn.addEventListener("click", () => { expandSeason=expandSeason===btn.dataset.season?null:btn.dataset.season; renderSeasons(games); });
  });

  renderSeasonChart(rows);
  attachSortListeners();
}

function renderSeasonChart(rows) {
  const ctx = document.getElementById("season-chart");
  if (!ctx) return;
  if (ctx._chartInstance) ctx._chartInstance.destroy();
  const chrono = [...rows].sort((a,b)=>a.season.localeCompare(b.season));
  ctx._chartInstance = new Chart(ctx, {
    type:"bar",
    data:{ labels:chrono.map(r=>r.season), datasets:[
      { label:"W",   data:chrono.map(r=>r.rec.w),   backgroundColor:"rgba(76,175,125,0.75)",  borderRadius:4 },
      { label:"L",   data:chrono.map(r=>r.rec.l),   backgroundColor:"rgba(224,82,82,0.75)",   borderRadius:4 },
      { label:"OTL", data:chrono.map(r=>r.rec.otl), backgroundColor:"rgba(255,140,0,0.75)",   borderRadius:4 },
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{color:"#888",boxWidth:12} } },
      scales:{ x:{stacked:true,ticks:{color:"#888"},grid:{color:"rgba(255,255,255,0.05)"}}, y:{stacked:true,ticks:{color:"#888",stepSize:1},grid:{color:"rgba(255,255,255,0.05)"}} } },
  });
}

// ── SPECIAL GAMES ─────────────────────────────────────────────
function renderSpecial(games) {
  const hg = games.reduce((s,g)=>s+(parseInt(g.spHomeScore,10)||0),0);
  const ag = games.reduce((s,g)=>s+(parseInt(g.spAwayScore,10)||0),0);
  document.getElementById("sp-gp").textContent = games.length;
  document.getElementById("sp-gf").textContent = hg;
  document.getElementById("sp-ga").textContent = ag;

  const sorted = [...games].sort((a,b) => new Date(b.date) - new Date(a.date));

  const tbody = document.querySelector("#special-table tbody");
  tbody.innerHTML = sorted.map((g, i) => {
    const hs=parseInt(g.spHomeScore,10), as_=parseInt(g.spAwayScore,10);
    const at=g.spAwayTeam||g.opponent, ht=g.spHomeTeam||"—";
    const ot=(g.spOvertime||"").toLowerCase()==="yes"?"Yes":"";
    let winner="—";
    if (!isNaN(hs)&&!isNaN(as_)) winner = hs>as_?ht:as_>hs?at:"Tie";
    const score=(!isNaN(as_)&&!isNaN(hs))?`${as_}–${hs}`:"—";
    const isOpen = expandSp === i;
    return `<tr class="main-row sp-row${isOpen ? " row-open" : ""}" data-sp-i="${i}" style="cursor:pointer" title="Click to view game details">
      <td>${fmtDate(g.date)} <span class="chevron">${isOpen ? "▴" : "▾"}</span></td>
      <td>${g.homeAway==="Home"?"🏠":"✈️"} ${g.homeAway}</td>
      <td>${teamLogo(at)}<span>${at}</span></td>
      <td>${teamLogo(ht)}<span>${ht}</span></td>
      <td style="text-align:center">${score}</td>
      <td class="gold-bold">${winner}</td>
      <td style="text-align:center;color:var(--ot)">${ot}</td>
      <td class="dim">${g.guests.join(", ")||"—"}</td>
      <td class="dim">${g.notes||"—"}</td>
    </tr>
    ${isOpen ? `<tr class="sp-expand-tr"><td colspan="9" style="padding:0"><div class="nhl-panel sp-panel" id="sp-panel-${i}"><div class="nhl-loading">Loading game data…</div></div></td></tr>` : ""}`;
  }).join("");

  tbody.querySelectorAll(".sp-row").forEach(tr => {
    tr.addEventListener("click", () => {
      const i = +tr.dataset.spI;
      expandSp = expandSp === i ? null : i;
      renderSpecial(games);
    });
  });

  if (expandSp !== null && expandSp < sorted.length) {
    loadNhlDetailForGame(sorted[expandSp], `sp-panel-${expandSp}`);
  }
}

// ── MAP ───────────────────────────────────────────────────────
function visitedArenaMap(games) {
  const map = {};
  games.forEach(g => {
    const abbr = g.homeAway === "Home" ? "BOS" : (OPP_TO_ABBR[g.opponent] || null);
    if (!abbr) return;
    (map[abbr] = map[abbr] || []).push(g);
  });
  return map;
}

function createLogoIcon(abbr, visited, selected) {
  const src = `https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`;
  const fb  = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/${abbr.toLowerCase()}.png&h=40&w=40`;
  let cls   = "arena-logo-marker";
  if (!visited && !selected) cls += " arena-logo-dim";
  if (selected)              cls += " arena-logo-selected";
  return L.divIcon({
    className: "logo-icon-wrap",
    html: `<div class="${cls}"><img src="${src}" alt="${abbr}" onerror="this.src='${fb}';this.onerror=function(){this.style.display='none'}"></div>`,
    iconSize:     [38, 38],
    iconAnchor:   [19, 19],
    tooltipAnchor:[0, -22],
    popupAnchor:  [0, -22],
  });
}

function gamesAtArena(games, abbr) {
  return games.filter(g => {
    const ga = g.homeAway === "Home" ? "BOS" : (OPP_TO_ABBR[g.opponent] || null);
    return ga === abbr;
  });
}

// ── PLAYER STATS ──────────────────────────────────────────────

function aggregatePlayerStats(games) {
  const byPlayer = {}; // name → { perTeam: { abbr → {g,a,pts,gp:Set,stars} } }

  const addContrib = (name, abbr, type, dateStr) => {
    if (!name || !abbr) return;
    if (!byPlayer[name]) byPlayer[name] = { perTeam: {} };
    if (!byPlayer[name].perTeam[abbr]) byPlayer[name].perTeam[abbr] = { g: 0, a: 0, pts: 0, gp: new Set(), stars: 0, star1: 0, star2: 0, star3: 0 };
    const e = byPlayer[name].perTeam[abbr];
    e.gp.add(dateStr);
    if (type === "g") { e.g++; e.pts++; }
    else              { e.a++; e.pts++; }
  };

  for (const g of games) {
    const dateStr = normaliseDateStr(g.date);
    const cached  = espnCache[dateStr];
    if (!cached) continue;
    for (const play of (cached.scoringPlays || [])) {
      const abbr = (play.team || "").toUpperCase();
      addContrib(play.scorer, abbr, "g", dateStr);
      (play.assists || []).forEach(n => addContrib(n, abbr, "a", dateStr));
    }
    for (const st of (cached.stars || [])) {
      if (!st?.name) continue;
      const abbr = (st.team || "").toUpperCase();
      if (!byPlayer[st.name]) byPlayer[st.name] = { perTeam: {} };
      if (!byPlayer[st.name].perTeam[abbr]) byPlayer[st.name].perTeam[abbr] = { g: 0, a: 0, pts: 0, gp: new Set(), stars: 0, star1: 0, star2: 0, star3: 0 };
      const se = byPlayer[st.name].perTeam[abbr];
      se.stars++;
      if (st.order === 1) se.star1++;
      else if (st.order === 2) se.star2++;
      else if (st.order === 3) se.star3++;
    }
  }

  return Object.entries(byPlayer).map(([name, data]) => {
    const teams = Object.keys(data.perTeam);
    const isMulti = teams.length > 1;
    let g = 0, a = 0, pts = 0, stars = 0, star1 = 0, star2 = 0, star3 = 0;
    const allGP = new Set();
    for (const e of Object.values(data.perTeam)) {
      g += e.g; a += e.a; pts += e.pts; stars += e.stars;
      star1 += e.star1; star2 += e.star2; star3 += e.star3;
      e.gp.forEach(d => allGP.add(d));
    }
    return {
      name, isMulti,
      abbr: isMulti ? "NHL" : (teams[0] || ""),
      g, a, pts, stars, star1, star2, star3, gp: allGP.size,
      perTeam: teams.map(abbr => {
        const e = data.perTeam[abbr];
        return { abbr, g: e.g, a: e.a, pts: e.pts, stars: e.stars, star1: e.star1, star2: e.star2, star3: e.star3, gp: e.gp.size };
      }).sort((x, y) => y.pts - x.pts),
    };
  });
}

function aggregateGoalieStats(games) {
  // byGoalie: name → { perTeam: { abbr → { w,l,otl,so,pts,stars,gp } } }
  const byGoalie = {};

  const getEntry = (name, abbr) => {
    if (!byGoalie[name]) byGoalie[name] = { perTeam: {} };
    if (!byGoalie[name].perTeam[abbr]) byGoalie[name].perTeam[abbr] = { w: 0, l: 0, otl: 0, so: 0, pts: 0, stars: 0, star1: 0, star2: 0, star3: 0, gp: 0 };
    return byGoalie[name].perTeam[abbr];
  };

  // Pass 1: decision goalies
  for (const g of games) {
    const dateStr = normaliseDateStr(g.date);
    const cached  = espnCache[dateStr];
    if (!cached?.goalies?.length) continue;
    const wentOT = (cached.periods || []).some(p => /OT|SO/i.test(p.label));
    for (const gl of cached.goalies) {
      if (!gl.name || !gl.decision) continue;
      const abbr = (gl.team || "").toUpperCase();
      const e = getEntry(gl.name, abbr);
      e.gp++;
      if (gl.decision === "W") {
        e.w++;
      } else {
        const bosLostOT = abbr === "BOS" && g.result === "OTL";
        const oppLostOT = abbr !== "BOS" && g.result === "W" && wentOT;
        (bosLostOT || oppLostOT) ? e.otl++ : e.l++;
      }
      if (gl.goalsAgainst === 0) e.so++;
    }
  }

  // Pass 2: star appearances (pos="G" or already known goalie)
  for (const g of games) {
    const dateStr = normaliseDateStr(g.date);
    const cached  = espnCache[dateStr];
    if (!cached) continue;
    for (const st of (cached.stars || [])) {
      if (!st?.name) continue;
      const isKnown   = !!byGoalie[st.name];
      const posGoalie = (st.pos || "").toUpperCase() === "G";
      if (!isKnown && !posGoalie) continue;
      const ge = getEntry(st.name, (st.team || "").toUpperCase());
      ge.stars++;
      if (st.order === 1) ge.star1++;
      else if (st.order === 2) ge.star2++;
      else if (st.order === 3) ge.star3++;
    }
  }

  // Pass 3: goalie points from scoring plays
  const goalieNames = new Set(Object.keys(byGoalie));
  for (const g of games) {
    const dateStr = normaliseDateStr(g.date);
    const cached  = espnCache[dateStr];
    if (!cached) continue;
    for (const play of (cached.scoringPlays || [])) {
      const abbr = (play.team || "").toUpperCase();
      if (goalieNames.has(play.scorer))                          getEntry(play.scorer, abbr).pts++;
      (play.assists || []).forEach(n => { if (goalieNames.has(n)) getEntry(n, abbr).pts++; });
    }
  }

  // Flatten — aggregate totals + per-team breakdown
  return Object.entries(byGoalie).map(([name, data]) => {
    const teams   = Object.keys(data.perTeam);
    const isMulti = teams.length > 1;
    let w = 0, l = 0, otl = 0, so = 0, pts = 0, stars = 0, star1 = 0, star2 = 0, star3 = 0, gp = 0;
    for (const e of Object.values(data.perTeam)) {
      w += e.w; l += e.l; otl += e.otl; so += e.so; pts += e.pts;
      stars += e.stars; star1 += e.star1; star2 += e.star2; star3 += e.star3; gp += e.gp;
    }
    return {
      name, isMulti,
      team: isMulti ? "NHL" : (teams[0] || ""),
      w, l, otl, so, pts, stars, star1, star2, star3, gp,
      perTeam: teams.map(abbr => ({ abbr, ...data.perTeam[abbr] })).sort((a, b) => b.w - a.w),
    };
  }).sort((a, b) => b.w - a.w || b.gp - a.gp);
}

function makePlayerLink(name) {
  return `<span class="ps-player-link" data-pname="${encodeURIComponent(name)}">${name}</span>`;
}

function teamLogoByAbbr(abbr) {
  if (!abbr || abbr === "NHL") {
    // NHL league logo
    return `<img src="https://assets.nhle.com/logos/nhl/svg/NHL_light.svg" alt="NHL" class="team-logo" onerror="this.style.display='none'">`;
  }
  const a = abbr.toLowerCase();
  const src = `https://assets.nhle.com/logos/nhl/svg/${abbr.toUpperCase()}_light.svg`;
  const fb  = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/${a}.png&h=40&w=40`;
  return `<img src="${src}" alt="${abbr}" class="team-logo" onerror="this.src='${fb}';this.onerror=function(){this.style.display='none'}">`;
}

function projectPlayer(player) {
  let teams;
  if (psTeamFilter.size > 0) {
    teams = player.perTeam.filter(t => psTeamFilter.has(t.abbr));
  } else if (psFilter === "bos") {
    teams = player.perTeam.filter(t => t.abbr === "BOS");
  } else if (psFilter === "opp") {
    teams = player.perTeam.filter(t => t.abbr !== "BOS");
  } else {
    return player;
  }
  if (teams.length === 0) return null;
  let g = 0, a = 0, pts = 0, stars = 0, star1 = 0, star2 = 0, star3 = 0, gp = 0;
  for (const t of teams) {
    g += t.g; a += t.a; pts += t.pts; stars += t.stars;
    star1 += t.star1; star2 += t.star2; star3 += t.star3; gp += t.gp;
  }
  return { ...player, abbr: teams.length === 1 ? teams[0].abbr : "NHL", isMulti: teams.length > 1, g, a, pts, stars, star1, star2, star3, gp, perTeam: teams };
}

function projectGoalie(goalie) {
  let teams;
  if (psTeamFilter.size > 0) {
    teams = goalie.perTeam.filter(t => psTeamFilter.has(t.abbr));
  } else if (psFilter === "bos") {
    teams = goalie.perTeam.filter(t => t.abbr === "BOS");
  } else if (psFilter === "opp") {
    teams = goalie.perTeam.filter(t => t.abbr !== "BOS");
  } else {
    return goalie;
  }
  if (teams.length === 0) return null;
  let w = 0, l = 0, otl = 0, so = 0, pts = 0, stars = 0, star1 = 0, star2 = 0, star3 = 0, gp = 0;
  for (const t of teams) {
    w += t.w; l += t.l; otl += t.otl; so += t.so; pts += t.pts;
    stars += t.stars; star1 += t.star1; star2 += t.star2; star3 += t.star3; gp += t.gp;
  }
  return { ...goalie, team: teams.length === 1 ? teams[0].abbr : "NHL", isMulti: teams.length > 1, w, l, otl, so, pts, stars, star1, star2, star3, gp, perTeam: teams };
}

function updatePsTeamLabel() {
  const el = document.getElementById("ps-team-label");
  if (!el) return;
  if (psTeamFilter.size === 0) {
    el.textContent = psFilter === "bos" ? "Bruins Only" : psFilter === "opp" ? "Opponents Only" : "All Teams";
  } else if (psTeamFilter.size === 1) {
    const abbr  = [...psTeamFilter][0];
    const arena = NHL_ARENAS.find(a => a.abbr === abbr);
    el.textContent = arena ? arena.team : abbr;
  } else {
    el.textContent = `${psTeamFilter.size} Teams`;
  }
}

function setupPsTeamDropdown() {
  if (psDropdownBuilt) return;
  psDropdownBuilt = true;
  const panel = document.getElementById("ps-team-panel");
  if (!panel) return;
  const teams = [...NHL_ARENAS].sort((a, b) => a.team.localeCompare(b.team));
  panel.innerHTML = `
    <div class="ps-dd-presets">
      <button class="pill active" data-ps-preset="all">All Players</button>
      <button class="pill" data-ps-preset="bos">Bruins Only</button>
      <button class="pill" data-ps-preset="opp">Opponents Only</button>
    </div>
    <div class="season-dd-divider"></div>
    <div class="ps-dd-team-list">
      ${teams.map(t => `<label class="season-dd-item">
        <input type="checkbox" value="${t.abbr}" class="ps-team-check">
        ${teamLogoByAbbr(t.abbr)}<span>${t.team}</span>
      </label>`).join("")}
    </div>`;
}

function renderPlayerStatsTable(games) {
  const allSkaters = aggregatePlayerStats(games);
  const goalies    = aggregateGoalieStats(games);

  // Show only the active position table full-width; hide the other
  const grid = document.querySelector(".ps-tables-grid");
  const [skaterDiv, goalieDiv] = grid ? [...grid.children] : [null, null];
  if (grid) {
    if (psPosition === "skater") {
      grid.classList.add("ps-single-col");
      if (skaterDiv) skaterDiv.style.display = "";
      if (goalieDiv) goalieDiv.style.display = "none";
    } else {
      grid.classList.add("ps-single-col");
      if (skaterDiv) skaterDiv.style.display = "none";
      if (goalieDiv) goalieDiv.style.display = "";
    }
  }

  updatePsTeamLabel();
  const filtered        = allSkaters.map(p => projectPlayer(p)).filter(Boolean);
  const filteredGoalies = goalies.map(gl => projectGoalie(gl)).filter(Boolean);

  const sortVal = p => {
    if (psSortCol === "name") return p.name.toLowerCase();
    return p[psSortCol] ?? 0;
  };
  const sorted = [...filtered].sort((a, b) => {
    const av = sortVal(a), bv = sortVal(b);
    const cmp = typeof av === "string" ? av.localeCompare(bv) : bv - av;
    return psSortDir === "asc" ? -cmp : cmp;
  });

  // Stat cards — reflect active filters
  const gamesWithData = games.filter(g => {
    if (!espnCache[normaliseDateStr(g.date)]) return false;
    if (psTeamFilter.size === 0) return true;
    const oppAbbr = (OPP_TO_ABBR[g.opponent] || g.opponent || "").toUpperCase();
    return psTeamFilter.has(oppAbbr) || psTeamFilter.has("BOS");
  }).length;
  const shutoutsTracked = filteredGoalies.reduce((s, gl) => s + (gl.so || 0), 0);
  document.getElementById("ps-games-loaded").textContent   = gamesWithData;
  document.getElementById("ps-total-players").textContent  = filtered.length;
  document.getElementById("ps-total-goals").textContent    = filtered.reduce((s, p) => s + p.g, 0);
  document.getElementById("ps-total-goalies").textContent  = filteredGoalies.length;
  document.getElementById("ps-total-shutouts").textContent = shutoutsTracked;
  document.getElementById("ps-loaded-content").style.display = "";

  // Skater table header
  const colLabels = { gp: "GP", g: "G", a: "A", pts: "PTS", stars: "★", star1: "1st", star2: "2nd", star3: "3rd" };
  document.querySelector("#ps-skaters-table thead tr").innerHTML = `
    <th class="sortable ps-sort-th${psSortCol==="name"?" ps-sort-active":""}" data-ps-col="name">
      Player${psSortCol==="name"?(psSortDir==="asc"?" ↑":" ↓"):""}
    </th>
    <th>Team</th>
    ${["gp","g","a","pts","stars","star1","star2","star3"].map(c =>
      `<th class="sortable ps-sort-th${psSortCol===c?" ps-sort-active":""}" data-ps-col="${c}">${colLabels[c]}${psSortCol===c?(psSortDir==="asc"?" ↑":" ↓"):""}</th>`
    ).join("")}`;

  // Skater table rows
  const rows = [];
  for (const p of sorted) {
    const isExp  = psExpanded.has(p.name);
    const teamCell = p.isMulti
      ? `${teamLogoByAbbr("NHL")}<span class="dim">MULTI</span>`
      : `${teamLogoByAbbr(p.abbr)}<span class="dim">${p.abbr || "—"}</span>`;
    const expandIcon = p.isMulti ? `<span class="ps-expand-icon">▶</span>` : `<span style="display:inline-block;width:1rem"></span>`;
    rows.push(`<tr class="${p.isMulti ? `ps-multi-row${isExp?" ps-expanded":""}` : ""}" data-ps-player="${encodeURIComponent(p.name)}">
      <td>${expandIcon}<strong>${makePlayerLink(p.name)}</strong></td>
      <td>${teamCell}</td>
      <td>${p.gp}</td><td>${p.g}</td><td>${p.a}</td>
      <td>${p.pts}</td>
      <td>${p.stars ? `<span class="ps-stars-badge">★ ${p.stars}</span>` : "—"}</td>
      <td>${p.star1 || "—"}</td><td>${p.star2 || "—"}</td><td>${p.star3 || "—"}</td>
    </tr>`);
    if (p.isMulti && isExp) {
      for (const t of p.perTeam) {
        rows.push(`<tr class="ps-sub-row">
          <td></td>
          <td>${teamLogoByAbbr(t.abbr)}<span class="dim">${t.abbr}</span></td>
          <td>${t.gp}</td><td>${t.g}</td><td>${t.a}</td>
          <td style="color:var(--gold);font-family:var(--font-d);font-weight:700">${t.pts}</td>
          <td>${t.stars ? `<span class="ps-stars-badge">★ ${t.stars}</span>` : "—"}</td>
          <td>${t.star1 || "—"}</td><td>${t.star2 || "—"}</td><td>${t.star3 || "—"}</td>
        </tr>`);
      }
    }
  }
  document.querySelector("#ps-skaters-table tbody").innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="10" class="dim" style="text-align:center;padding:1.5rem">No skater data for selected filter.</td></tr>`;

  // Skater sort header click
  document.querySelectorAll("#ps-skaters-table .ps-sort-th").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.psCol;
      psSortDir = psSortCol === col && psSortDir === "desc" ? "asc" : "desc";
      psSortCol = col;
      renderPlayerStatsTable(games);
    });
  });

  // Multi-team expand click
  document.querySelectorAll(".ps-multi-row").forEach(row => {
    row.addEventListener("click", () => {
      const name = decodeURIComponent(row.dataset.psPlayer || "");
      psExpanded.has(name) ? psExpanded.delete(name) : psExpanded.add(name);
      renderPlayerStatsTable(games);
    });
  });

  // Goalie table header — dynamic, sortable
  const gColLabels = { gp:"GP", w:"W", l:"L", otl:"OTL", so:"SO", pts:"PTS", stars:"★", star1:"1st", star2:"2nd", star3:"3rd" };
  document.querySelector("#ps-goalies-table thead tr").innerHTML = `
    <th class="sortable ps-sort-th${psGoalieSortCol==="name"?" ps-sort-active":""}" data-pg-col="name">
      Player${psGoalieSortCol==="name"?(psGoalieSortDir==="asc"?" ↑":" ↓"):""}
    </th>
    <th>Team</th>
    ${["gp","w","l","otl","so","pts","stars","star1","star2","star3"].map(c =>
      `<th class="sortable ps-sort-th${psGoalieSortCol===c?" ps-sort-active":""}" data-pg-col="${c}">${gColLabels[c]}${psGoalieSortCol===c?(psGoalieSortDir==="asc"?" ↑":" ↓"):""}</th>`
    ).join("")}`;

  const gSortVal = gl => psGoalieSortCol === "name" ? gl.name.toLowerCase() : (gl[psGoalieSortCol] ?? 0);
  const sortedGoalies = [...filteredGoalies].sort((a, b) => {
    const av = gSortVal(a), bv = gSortVal(b);
    const cmp = typeof av === "string" ? av.localeCompare(bv) : bv - av;
    return psGoalieSortDir === "asc" ? -cmp : cmp;
  });

  // Goalie table rows — multi-team support mirrors skater logic
  const goalieRows = [];
  for (const gl of sortedGoalies) {
    const key   = `g-${gl.name}`;
    const isExp = psExpanded.has(key);
    const teamCell  = gl.isMulti
      ? `${teamLogoByAbbr("NHL")}<span class="dim">MULTI</span>`
      : `${teamLogoByAbbr(gl.team)}<span class="dim">${gl.team || "—"}</span>`;
    const expandIcon = gl.isMulti
      ? `<span class="ps-expand-icon">▶</span>`
      : `<span style="display:inline-block;width:1rem"></span>`;
    goalieRows.push(`<tr class="${gl.isMulti ? `ps-multi-row${isExp ? " ps-expanded" : ""}` : ""}" data-ps-goalie="${encodeURIComponent(gl.name)}">
      <td>${expandIcon}<strong>${makePlayerLink(gl.name)}</strong></td>
      <td>${teamCell}</td>
      <td>${gl.gp}</td>
      <td>${gl.w}</td><td>${gl.l}</td><td>${gl.otl}</td>
      <td>${gl.so || "—"}</td>
      <td>${gl.pts || "—"}</td>
      <td>${gl.stars ? `<span class="ps-stars-badge">★ ${gl.stars}</span>` : "—"}</td>
      <td>${gl.star1 || "—"}</td><td>${gl.star2 || "—"}</td><td>${gl.star3 || "—"}</td>
    </tr>`);
    if (gl.isMulti && isExp) {
      for (const t of gl.perTeam) {
        goalieRows.push(`<tr class="ps-sub-row">
          <td></td>
          <td>${teamLogoByAbbr(t.abbr)}<span class="dim">${t.abbr}</span></td>
          <td>${t.gp}</td>
          <td>${t.w}</td><td>${t.l}</td><td>${t.otl}</td>
          <td>${t.so || "—"}</td>
          <td>${t.pts || "—"}</td>
          <td>${t.stars ? `<span class="ps-stars-badge">★ ${t.stars}</span>` : "—"}</td>
          <td>${t.star1 || "—"}</td><td>${t.star2 || "—"}</td><td>${t.star3 || "—"}</td>
        </tr>`);
      }
    }
  }
  document.querySelector("#ps-goalies-table tbody").innerHTML = goalieRows.length
    ? goalieRows.join("")
    : `<tr><td colspan="12" class="dim" style="text-align:center;padding:1.5rem">No goalie data yet.</td></tr>`;

  // Goalie multi-team expand click
  document.querySelectorAll("[data-ps-goalie]").forEach(row => {
    row.addEventListener("click", () => {
      const key = `g-${decodeURIComponent(row.dataset.psGoalie || "")}`;
      psExpanded.has(key) ? psExpanded.delete(key) : psExpanded.add(key);
      renderPlayerStatsTable(games);
    });
  });

  // Goalie sort header click
  document.querySelectorAll("#ps-goalies-table .ps-sort-th").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.pgCol;
      psGoalieSortDir = psGoalieSortCol === col && psGoalieSortDir === "desc" ? "asc" : "desc";
      psGoalieSortCol = col;
      renderPlayerStatsTable(games);
    });
  });
}

async function fetchAllPlayerStats(games) {
  playerStatsLoading = true;
  const statusEl   = document.getElementById("ps-status");
  const nonSpecial = ALL_GAMES.filter(g => g.seasonType?.toLowerCase() !== "special");
  const total = nonSpecial.length;
  let loaded = 0;

  const showProgress = n => {
    if (!statusEl) return;
    const pct = Math.round((n / total) * 100);
    statusEl.innerHTML = `
      <div class="ps-progress-wrap">
        <div class="ps-progress-label">Loading game data… ${n} / ${total} games</div>
        <div class="ps-progress-bar-track"><div class="ps-progress-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
  };

  showProgress(0);
  for (const g of nonSpecial) {
    await fetchEspnGame(g);
    loaded++;
    if (loaded % 3 === 0 || loaded === total) showProgress(loaded);
  }

  playerStatsLoading = false;
  playerStatsFetched = true;
  if (statusEl) statusEl.innerHTML = "";
  renderPlayerStatsTable(games);
}

function renderPlayerStats(games) {
  const filtersEl = document.getElementById("ps-filters");
  if (filtersEl) filtersEl.innerHTML = filterPillsHTML();
  if (!document.getElementById("tab-playerstats")?.classList.contains("active")) return;
  setupPsTeamDropdown();
  if (playerStatsFetched) { renderPlayerStatsTable(games); return; }
  if (playerStatsLoading) return;
  fetchAllPlayerStats(games);
}

// Player name links → ESPN stats page (lazy ID lookup)
document.addEventListener("click", async e => {
  const el = e.target.closest(".ps-player-link");
  if (!el || el.classList.contains("ps-link-loading")) return;
  const name = decodeURIComponent(el.dataset.pname || "");
  if (!name) return;
  if (el.dataset.espnUrl) { window.open(el.dataset.espnUrl, "_blank"); return; }
  el.classList.add("ps-link-loading");
  try {
    const r = await fetch(`/.netlify/functions/espn-player?name=${encodeURIComponent(name)}`);
    const j = await r.json();
    if (j.url) { el.dataset.espnUrl = j.url; window.open(j.url, "_blank"); }
  } catch (_) {}
  el.classList.remove("ps-link-loading");
});

// Delegated click for position pills (Skater / Goalie)
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-ps-pos]");
  if (!btn) return;
  document.querySelectorAll("[data-ps-pos]").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  psPosition = btn.dataset.psPos;
  renderPlayerStatsTable(filteredGames(false));
});

// Toggle team dropdown open/close
document.addEventListener("click", e => {
  const btn   = e.target.closest("#ps-team-btn");
  const wrap  = document.getElementById("ps-team-dropdown");
  const panel = document.getElementById("ps-team-panel");
  if (!wrap || !panel) return;
  if (btn) {
    setupPsTeamDropdown();
    const open = wrap.classList.toggle("dd-open");
    panel.classList.toggle("open", open);
    return;
  }
  // Close if click is outside the dropdown
  if (!e.target.closest("#ps-team-dropdown")) {
    wrap.classList.remove("dd-open");
    panel.classList.remove("open");
  }
});

// Preset pills inside team dropdown (All Players / Bruins Only / Opponents Only)
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-ps-preset]");
  if (!btn) return;
  psFilter = btn.dataset.psPreset;
  psTeamFilter.clear();
  document.querySelectorAll("[data-ps-preset]").forEach(b => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".ps-team-check").forEach(cb => { cb.checked = false; });
  // Close dropdown
  const wrap  = document.getElementById("ps-team-dropdown");
  const panel = document.getElementById("ps-team-panel");
  if (wrap)  wrap.classList.remove("dd-open");
  if (panel) panel.classList.remove("open");
  renderPlayerStatsTable(filteredGames(false));
});

// Individual team checkbox changes
document.addEventListener("change", e => {
  const cb = e.target.closest(".ps-team-check");
  if (!cb) return;
  if (cb.checked) psTeamFilter.add(cb.value); else psTeamFilter.delete(cb.value);
  // Deactivate presets when specific teams are chosen
  psFilter = "all";
  document.querySelectorAll("[data-ps-preset]").forEach(b => b.classList.remove("active"));
  renderPlayerStatsTable(filteredGames(false));
});

function renderMap(games) {
  const filtersEl = document.getElementById("map-filters");
  if (filtersEl) filtersEl.innerHTML = filterPillsHTML();

  const panel = document.getElementById("tab-map");
  if (!panel?.classList.contains("active")) {
    if (selectedArena) renderMapGameLog(games);
    return;
  }

  if (!mapInstance) {
    mapInstance = L.map("arena-map", { center: [44, -97], zoom: 4, minZoom: 3, maxZoom: 13 });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(mapInstance);
  }

  mapMarkers.forEach(m => m.remove());
  mapMarkers   = [];
  markersByAbbr = {};

  const visited = visitedArenaMap(games);

  NHL_ARENAS.forEach(arena => {
    const v          = visited[arena.abbr];
    const isSelected = selectedArena?.abbr === arena.abbr;
    const icon       = createLogoIcon(arena.abbr, !!v, isSelected);
    const marker     = L.marker([arena.lat, arena.lng], { icon }).addTo(mapInstance);
    markersByAbbr[arena.abbr] = marker;

    const rec       = v ? record(v) : null;
    const statsLine = rec
      ? `<div class="arena-popup-stats">${rec.gp} game${rec.gp > 1 ? "s" : ""} attended · ${rec.w}–${rec.l}–${rec.otl}</div>`
      : "";
    const logoSrc = `https://assets.nhle.com/logos/nhl/svg/${arena.abbr}_light.svg`;
    const logoFb  = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nhl/500/${arena.abbr.toLowerCase()}.png&h=52&w=52`;
    const wikiUrl = `https://en.wikipedia.org/wiki/${arena.wiki || arena.arena.replace(/ /g, "_")}`;

    // Hover tooltip — simple
    marker.bindTooltip(
      `<div class="arena-tip"><div class="arena-tip-team">${arena.team}</div><div class="arena-tip-arena">${arena.arena}</div></div>`,
      { direction: "top", offset: [0, -22], className: "arena-tooltip" }
    );

    // Click popup — persistent, with wiki link + logo
    marker.bindPopup(
      `<div class="arena-popup">
        <div class="arena-popup-main">
          <div class="arena-popup-info">
            <div class="arena-popup-team">${arena.team}</div>
            <div class="arena-popup-arena"><a href="${wikiUrl}" target="_blank" rel="noopener">${arena.arena} ↗</a></div>
            ${statsLine}
          </div>
          <img src="${logoSrc}" class="arena-popup-logo" alt="${arena.team}"
               onerror="this.src='${logoFb}';this.onerror=function(){this.style.display='none'}">
        </div>
      </div>`,
      { className: "arena-popup-wrap", maxWidth: 290, offset: [0, -6] }
    );

    marker.on("popupopen", () => {
      // Remove gold ring from any previously selected marker
      mapMarkers.forEach(m => m.getElement()?.querySelector(".arena-logo-marker")?.classList.remove("arena-logo-selected"));
      // Apply gold ring to this marker
      marker.getElement()?.querySelector(".arena-logo-marker")?.classList.add("arena-logo-selected");
      selectedArena = arena;
      expandMapGl   = null;
      renderMapGameLog(filteredGames(false));
    });

    marker.on("popupclose", () => {
      marker.getElement()?.querySelector(".arena-logo-marker")?.classList.remove("arena-logo-selected");
      if (selectedArena?.abbr === arena.abbr) {
        selectedArena = null;
        expandMapGl   = null;
        const el = document.getElementById("map-game-log");
        if (el) el.innerHTML = "";
      }
    });

    mapMarkers.push(marker);
  });

  // Auto-open TD Garden on first map tab load
  if (!mapAutoOpened) {
    mapAutoOpened = true;
    setTimeout(() => markersByAbbr["BOS"]?.openPopup(), 350);
  } else if (selectedArena) {
    renderMapGameLog(games);
  }
}

function renderMapGameLog(games) {
  const el = document.getElementById("map-game-log");
  if (!el) return;
  if (!selectedArena) { el.innerHTML = ""; return; }

  const arenaGames = gamesAtArena(games, selectedArena.abbr);
  const sorted = [...arenaGames].sort((a, b) => new Date(b.date) - new Date(a.date));

  function playoffLabel(g) {
    const r = g.playoffRound.trim(), gm = g.playoffGame.trim();
    if (!r && !gm) return "—";
    return (r ? `R${r}` : "") + (gm ? `G${gm}` : "");
  }

  const rows = sorted.length
    ? sorted.map((g, i) => {
        const isOpen = expandMapGl === i;
        return `
        <tr class="main-row gl-row${isOpen ? " row-open" : ""}" data-mgl-i="${i}" style="cursor:pointer" title="Click to view game details">
          <td class="dim">${g.season || extractSeason(g.date)}</td>
          <td class="dim">${g.seasonType || "—"}</td>
          <td><span class="gl-date-btn">${fmtDate(g.date)}</span> <span class="chevron">${isOpen ? "▴" : "▾"}</span></td>
          <td>${teamLogo(g.opponent)}<span>${g.opponent}</span></td>
          <td>${g.goalsFor}–${g.goalsAgainst}</td>
          <td>${resultBadge(g.result)}</td>
          <td class="dim">${playoffLabel(g)}</td>
          <td class="dim">${g.guests.join(", ") || "—"}</td>
          <td class="dim">${g.notes || "—"}</td>
        </tr>
        ${isOpen ? `<tr class="gl-expand-tr"><td colspan="9" style="padding:0"><div class="nhl-panel gl-panel" id="mgl-panel-${i}"><div class="nhl-loading">Loading game data…</div></div></td></tr>` : ""}`;
      }).join("")
    : `<tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:2rem">No games at this arena match the current filters.</td></tr>`;

  el.innerHTML = `
    <div class="section-heading">${selectedArena.team}
      <span class="section-hint">— ${selectedArena.arena} · ${sorted.length} game${sorted.length !== 1 ? "s" : ""} attended · click a game for details</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Season</th><th>Game Type</th><th>Date</th><th>Opponent</th>
          <th>Score</th><th>Result</th><th>Playoff</th><th>Guest</th><th>Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  el.querySelectorAll(".gl-row[data-mgl-i]").forEach(tr => {
    tr.addEventListener("click", () => {
      const i = +tr.dataset.mglI;
      expandMapGl = expandMapGl === i ? null : i;
      renderMapGameLog(games);
    });
  });

  if (expandMapGl !== null && expandMapGl < sorted.length) {
    loadNhlDetailForGame(sorted[expandMapGl], `mgl-panel-${expandMapGl}`);
  }
}

// ── UTILS ─────────────────────────────────────────────────────
function setLoading(on) { document.getElementById("loading-overlay").style.display = on?"block":"none"; }
function showError(msg) {
  const el = document.getElementById("error-banner");
  el.innerHTML = `<div class="error-msg">⚠️ Could not load game data: ${msg}. Make sure your Netlify function is deployed and your sheet is published.</div>`;
  el.style.display = "block";
}
