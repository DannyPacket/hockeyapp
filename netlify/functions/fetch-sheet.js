const SHEET_ID = "1hyLJ-8UEdIiz1XnHGS5TTZdECbwkMVM3SZ95Pusti_M";

const CATEGORY_GIDS = {
  weddings: "889524951",
  concerts: "1410391466",
  "living-situations": "499935000",
};

exports.handler = async (event) => {
  const category = (event.queryStringParameters || {}).category;
  const gid = CATEGORY_GIDS[category];

  if (!gid) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: `Unknown category: ${category}`, entries: [] }),
    };
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Sheet fetch failed: " + response.status);

    const csv = await response.text();
    const entries = parseCSV(csv);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify({ entries, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message, entries: [] }),
    };
  }
};

// CSV parser that walks the raw text char-by-char (rather than splitting on
// newlines first) so quoted fields containing embedded line breaks — e.g.
// multi-line addresses — parse as a single field instead of breaking rows.
function parseCSV(text) {
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);

  const nonEmptyRows = rows.filter((r) => r.some((v) => v.trim() !== ""));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map((h) => h.trim());
  return nonEmptyRows.slice(1).map((fields) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (fields[i] || "").trim(); });
    return obj;
  });
}
