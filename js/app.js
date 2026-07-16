const FUNCTIONS_BASE = "/.netlify/functions/fetch-sheet";

// ── PASSCODE GATE ──────────────────────────────────────────────
// This is a privacy speed bump, not real security: the hash lives in this
// client-side file, and the underlying sheet is still reachable directly.
// It just keeps the private details from showing up on casual page loads.
const GATE_KEY = "packey-unlocked";
const GATE_HASH = "4b9a7f50c0bb198c6f5414c5a8459f5d216d34ab521ea94c060ea35cac66f900"; // sha256("2012")

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isUnlocked() {
  return localStorage.getItem(GATE_KEY) === "1";
}

function unlockPage(onUnlock) {
  localStorage.setItem(GATE_KEY, "1");
  document.querySelector("main")?.classList.remove("gated");
  if (onUnlock) onUnlock();
}

function setupGate(onUnlock) {
  if (isUnlocked()) { unlockPage(onUnlock); return; }

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-input");
  const error = document.getElementById("gate-error");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(input.value.trim());
    if (hash === GATE_HASH) {
      unlockPage(onUnlock);
    } else {
      error.textContent = "Incorrect passcode.";
      input.value = "";
      input.focus();
    }
  });
}

const DATE_KEYS = {
  weddings: "Date",
  concerts: "Date",
  "living-situations": "Start Date",
};

const SORT_DIR = {
  weddings: "desc",
  concerts: "desc",
  "living-situations": "asc", // timeline reads oldest → newest
};

const RENDERERS = {
  weddings: renderWeddingCard,
  concerts: renderConcertCard,
};

// type "select" is populated with the field's unique values from the loaded
// rows; type "text" is a free-type substring match.
const FILTER_CONFIG = {
  weddings: [
    { id: "filter-whose", field: "Whose Wedding", type: "text" },
    { id: "filter-connection", field: "Connection", type: "select" },
    { id: "filter-plus1", field: "Plus 1", type: "select" },
  ],
  concerts: [
    { id: "filter-band", field: "Band", type: "select" },
    { id: "filter-location", field: "Location", type: "select" },
    { id: "filter-guest", field: "Guest", type: "text" },
  ],
};

// rows loaded per category, kept around so column-sort clicks can re-render
// the table without re-fetching, and so the map (always date-sorted,
// independent of the table's current sort) can reuse the same data.
const loadedRows = {};
const sortState = {};

async function loadEntries(category) {
  const container = document.getElementById("entries");
  const status = document.getElementById("entries-status");

  try {
    const res = await fetch(`${FUNCTIONS_BASE}?category=${category}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Failed to load");

    const rows = (data.entries || []).filter(hasContent);

    if (rows.length === 0) {
      status.textContent = "No entries yet — add a row to the Google Sheet.";
      return;
    }

    status.remove();
    loadedRows[category] = rows;

    if (category === "living-situations") {
      container.innerHTML = renderLivingTimeline([...rows].sort(byDateKey(DATE_KEYS[category], SORT_DIR[category])));
      return;
    }

    sortState[category] = { key: DATE_KEYS[category], dir: SORT_DIR[category] };
    setupSortableHeaders(category);
    setupFilters(category);
    renderTable(category);

    const mapRows = [...rows].sort(byDateKey("Date", "desc"));
    if (category === "weddings") initWeddingMap(mapRows);
    if (category === "concerts") initConcertMap(mapRows);
  } catch (err) {
    status.textContent = "Couldn't load entries from Google Sheets — check the sheet's sharing settings.";
    status.classList.add("error");
  }
}

// Case-insensitive, numeric-aware string comparator for any non-date column.
// Blank values always sort to the end regardless of direction, matching
// byDateKey's treatment of unparseable dates.
function byField(key, dir = "asc") {
  return (a, b) => {
    const va = (a[key] || "").toString().trim();
    const vb = (b[key] || "").toString().trim();
    if (!va && !vb) return 0;
    if (!va) return 1;
    if (!vb) return -1;
    const cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  };
}

function setupSortableHeaders(category) {
  document.querySelectorAll("thead th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      const state = sortState[category];
      if (state.key === key) {
        state.dir = state.dir === "asc" ? "desc" : "asc";
      } else {
        state.key = key;
        state.dir = key === DATE_KEYS[category] ? "desc" : "asc";
      }
      renderTable(category);
    });
  });
}

function setupFilters(category) {
  (FILTER_CONFIG[category] || []).forEach(({ id, field, type }) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (type === "select") {
      const values = [...new Set(loadedRows[category].map((r) => (r[field] || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      values.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        el.appendChild(opt);
      });
    }

    el.addEventListener(type === "text" ? "input" : "change", () => renderTable(category));
  });
}

function applyFilters(category, rows) {
  const config = FILTER_CONFIG[category] || [];
  return rows.filter((row) => config.every(({ id, field, type }) => {
    const el = document.getElementById(id);
    const val = el ? el.value.trim() : "";
    if (!val) return true;
    const cellVal = (row[field] || "").toString();
    return type === "text"
      ? cellVal.toLowerCase().includes(val.toLowerCase())
      : cellVal === val;
  }));
}

function renderTable(category) {
  const container = document.getElementById("entries");
  const { key, dir } = sortState[category];
  const isDateSort = key === DATE_KEYS[category];
  const comparator = isDateSort ? byDateKey(key, dir) : byField(key, dir);
  const filtered = applyFilters(category, loadedRows[category]);
  const sorted = [...filtered].sort(comparator);

  updateSortIndicators(category);

  if (sorted.length === 0) {
    const colCount = document.querySelectorAll("thead th[data-sort]").length || 1;
    container.innerHTML = `<tr><td class="no-results" colspan="${colCount}">No matching entries.</td></tr>`;
    return;
  }

  const rowsHtml = sorted.map(RENDERERS[category]);
  container.innerHTML = isDateSort ? withDateDivider(rowsHtml, sorted, key) : rowsHtml.join("");
}

// Only meaningful (and only shown) when the table is sorted by date: finds
// the single point in the sorted list where entries cross from
// future/today to past (or vice versa) and inserts a labeled divider row.
function withDateDivider(rowsHtml, sortedRows, dateKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFuture = (row) => {
    const d = parseDateSafe(row[dateKey]);
    return d ? d >= today : null;
  };

  let splitIndex = -1;
  for (let i = 0; i < sortedRows.length - 1; i++) {
    const f1 = isFuture(sortedRows[i]);
    const f2 = isFuture(sortedRows[i + 1]);
    if (f1 === null || f2 === null || f1 === f2) continue;
    splitIndex = i;
    break;
  }
  if (splitIndex === -1) return rowsHtml.join("");

  const colCount = (rowsHtml[0].match(/<td/g) || [""]).length;
  const todayLabel = today.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const divider = `<tr class="date-divider"><td colspan="${colCount}">📍 Today — ${todayLabel}</td></tr>`;

  const html = [...rowsHtml];
  html.splice(splitIndex + 1, 0, divider);
  return html.join("");
}

function updateSortIndicators(category) {
  const { key, dir } = sortState[category];
  document.querySelectorAll("thead th[data-sort]").forEach((th) => {
    const active = th.dataset.sort === key;
    th.classList.toggle("sorted", active);
    th.querySelector(".sort-arrow")?.remove();
    if (active) {
      const arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.textContent = dir === "asc" ? " ▲" : " ▼";
      th.appendChild(arrow);
    }
  });
}

function hasContent(row) {
  return Object.values(row).some((v) => v && v.trim() !== "");
}

function parseDateSafe(str) {
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function byDateKey(key, dir = "desc") {
  return (a, b) => {
    const da = parseDateSafe(a[key]);
    const db = parseDateSafe(b[key]);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    const diff = da - db; // ascending
    return dir === "asc" ? diff : -diff;
  };
}

function esc(str) {
  return (str || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const isUrl = (v) => /^https?:\/\//i.test((v || "").trim());

// Google Sheets' CSV export drops the href of rich-text hyperlinks and keeps
// only the visible text — so we can only make a real link when the cell
// itself contains a plain-text URL.
function linkCell(value) {
  const v = (value || "").trim();
  if (isUrl(v)) return `<a class="table-link" href="${esc(v)}" target="_blank" rel="noopener">Link ↗</a>`;
  if (v) return `<span class="table-link muted" title="Paste the actual URL as plain text in the sheet to make this clickable">Link</span>`;
  return `<span class="table-link muted">—</span>`;
}

function renderWeddingCard(row) {
  const location = esc(row["Location"]).replace(/\n/g, ", ");
  return `
    <tr>
      <td>${esc(row["Date"])}</td>
      <td>${esc(row["Whose Wedding"])}</td>
      <td>${esc(row["Connection"])}</td>
      <td>${row["Plus 1"] && row["Plus 1"] !== "None" ? esc(row["Plus 1"]) : "—"}</td>
      <td>${location}</td>
      <td>${linkCell(row["Official Album"])}</td>
      <td>${linkCell(row["Google Album"])}</td>
    </tr>`;
}

function renderConcertCard(row) {
  // No real setlist.fm URL in the sheet — fall back to a search link for the
  // band so there's always something useful to click through to.
  const setListValue = (row["Set List"] || "").trim();
  const band = (row["Band"] || "").trim();
  const setListCell = isUrl(setListValue)
    ? `<a class="table-link" href="${esc(setListValue)}" target="_blank" rel="noopener">Link ↗</a>`
    : band
      ? `<a class="table-link" href="https://www.setlist.fm/search?query=${encodeURIComponent(band)}" target="_blank" rel="noopener">Link ↗</a>`
      : `<span class="table-link muted">—</span>`;

  return `
    <tr>
      <td>${esc(row["Date"])}</td>
      <td>${esc(row["Band"])}</td>
      <td>${row["Opening Act"] ? esc(row["Opening Act"]) : "—"}</td>
      <td>${row["Tour"] ? esc(row["Tour"]) : "—"}</td>
      <td>${esc(row["Location"])}</td>
      <td>${row["Guest"] ? esc(row["Guest"]) : "—"}</td>
      <td>${setListCell}</td>
    </tr>`;
}

function renderLivingTimeline(rows) {
  const today = new Date();

  const items = rows.map((row, i) => {
    const start = parseDateSafe(row["Start Date"]);
    const end = parseDateSafe(row["End Date"]);
    const isCurrent = !!(start && end && today >= start && today <= end);

    const addrLines = (row["Address"] || "").split("\n").map(esc);
    const title = addrLines[0] || "—";
    const locLine = addrLines.slice(1).join(", ");
    const range = [row["Start Date"], isCurrent ? "Present" : row["End Date"]].filter(Boolean).join(" – ");
    const yrs = row["Years"] ? parseFloat(row["Years"]) : null;
    const side = i % 2 === 0 ? "side-left" : "side-right";

    return `
      <div class="timeline-item ${side}${isCurrent ? " current" : ""}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          ${isCurrent ? `<div class="timeline-badge">Current</div>` : ""}
          <div class="entry-date">${esc(range)}${yrs ? ` · ${yrs} yr${yrs === 1 ? "" : "s"}` : ""}</div>
          <h3>${title}</h3>
          <div class="entry-location">${locLine}</div>
          ${row["Roomates"] ? `<p>With ${esc(row["Roomates"])}</p>` : ""}
        </div>
      </div>`;
  }).join("");

  const todayLabel = today.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return `
    <div class="timeline-marker"><span class="badge">🎂 Born — January 1994</span></div>
    ${items}
    <div class="timeline-marker"><span class="badge">📍 Today — ${todayLabel}</span></div>`;
}

// Google Sheets' CSV export has no lat/lon, so venue addresses are geocoded
// ahead of time into data/*-locations.json. Rows/venues added to the sheet
// after that file was generated just won't have a marker until it's
// regenerated (npm run geocode:weddings / geocode:concerts).
async function initVenueMap({ mapElId, locationsUrl, rows, keyOf, sortRows, popupHtml }) {
  const mapEl = document.getElementById(mapElId);
  const hint = document.getElementById("map-hint");
  const toggle = document.getElementById("map-toggle");
  if (!mapEl || typeof L === "undefined") return;

  if (toggle) {
    toggle.addEventListener("click", () => {
      const collapsed = mapEl.classList.toggle("collapsed");
      toggle.textContent = collapsed ? "▸ Show Map" : "▾ Hide Map";
    });
  }

  let locations = {};
  try {
    const res = await fetch(locationsUrl);
    locations = await res.json();
  } catch (err) {
    if (hint) hint.textContent = "Map locations unavailable.";
  }

  const map = L.map(mapEl, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (!mapEl.classList.contains("collapsed")) setTimeout(() => map.invalidateSize(), 50);
    });
  }

  // Group by resolved coordinate (not by lookup key) so venues that share a
  // physical location — e.g. a renamed venue with two different names in the
  // sheet — collapse into a single pin instead of stacking markers.
  const groups = new Map();
  let matchedRows = 0;
  rows.forEach((row) => {
    const loc = locations[keyOf(row)];
    if (!loc) return;
    matchedRows++;
    const coordKey = `${loc.lat},${loc.lon}`;
    if (!groups.has(coordKey)) groups.set(coordKey, { loc, rows: [] });
    groups.get(coordKey).rows.push(row);
  });

  const markers = [];
  groups.forEach(({ loc, rows: groupRows }) => {
    if (sortRows) groupRows.sort(sortRows);
    const marker = L.marker([loc.lat, loc.lon]).addTo(map);
    marker.bindPopup(popupHtml(groupRows), { className: "venue-popup-wrap", maxHeight: 260 });
    markers.push(marker);
  });

  if (markers.length) {
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
  } else {
    map.setView([20, 0], 2);
  }

  if (hint) {
    hint.textContent = matchedRows < rows.length
      ? `${matchedRows} of ${rows.length} locations mapped`
      : `${matchedRows} location${matchedRows === 1 ? "" : "s"} mapped`;
  }
}

// Splits rows (already sorted newest-first) into consecutive runs sharing
// the same venue label, so a pin covering a renamed venue (e.g. Comcast
// Center → Xfinity Center) prints a fresh header only when the name changes.
function groupConsecutiveBy(rows, labelOf) {
  const sections = [];
  rows.forEach((row) => {
    const label = labelOf(row);
    const last = sections[sections.length - 1];
    if (last && last.label === label) last.rows.push(row);
    else sections.push({ label, rows: [row] });
  });
  return sections;
}

function initWeddingMap(rows) {
  return initVenueMap({
    mapElId: "wedding-map",
    locationsUrl: "../data/wedding-locations.json",
    rows,
    keyOf: (row) => `${row["Date"]}|${row["Whose Wedding"]}`,
    sortRows: byDateKey("Date", "desc"),
    popupHtml: (groupRows) => {
      const sections = groupConsecutiveBy(groupRows, (row) => (row["Location"] || "").split("\n")[0].trim());
      return `<div class="venue-popup">${sections.map((section) => `
        <div class="venue-popup-group">
          <div class="venue-popup-title">${esc(section.label) || "Venue"}</div>
          ${section.rows.map((row) => `
            <div class="venue-show">
              <div class="venue-show-date">${esc(row["Date"])}</div>
              <div class="venue-show-band">${esc(row["Whose Wedding"])}</div>
            </div>`).join("")}
        </div>`).join("")}</div>`;
    },
  });
}

function initConcertMap(rows) {
  return initVenueMap({
    mapElId: "concert-map",
    locationsUrl: "../data/concert-locations.json",
    rows,
    keyOf: (row) => (row["Location"] || "").trim(),
    sortRows: byDateKey("Date", "desc"),
    popupHtml: (groupRows) => {
      const sections = groupConsecutiveBy(groupRows, (row) => (row["Location"] || "").trim());
      return `<div class="venue-popup">${sections.map((section) => `
        <div class="venue-popup-group">
          <div class="venue-popup-title">${esc(section.label)}</div>
          ${section.rows.map((row) => {
            const setListValue = (row["Set List"] || "").trim();
            const band = (row["Band"] || "").trim();
            const setListHref = isUrl(setListValue)
              ? setListValue
              : band ? `https://www.setlist.fm/search?query=${encodeURIComponent(band)}` : null;
            return `
              <div class="venue-show">
                <div class="venue-show-date">${esc(row["Date"])}</div>
                <div class="venue-show-band">${esc(row["Band"])}</div>
                ${setListHref ? `<a class="venue-show-link" href="${esc(setListHref)}" target="_blank" rel="noopener">Set List ↗</a>` : ""}
              </div>`;
          }).join("")}
        </div>`).join("")}</div>`;
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const category = document.body.dataset.category;
  const loadIfNeeded = () => { if (category) loadEntries(category); };

  const main = document.querySelector("main");
  if (main && main.classList.contains("gated")) {
    setupGate(loadIfNeeded);
  } else {
    loadIfNeeded();
  }
});
