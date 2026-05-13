const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQM8b4kevAgoInq4xFZ6S1FAi4VdyRSvyFJ15mgUezCqvmK8Io5XIlkXhi6-r7iwuvz3MDv1dQh7Xu-/pub?gid=0&single=true&output=csv";

exports.handler = async () => {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error("Sheet fetch failed: " + response.status);

    const csv = await response.text();
    const games = parseCSV(csv);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
      // Return { games: [...] } so app.js can destructure const { games } = await res.json()
      body: JSON.stringify({ games, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message, games: [] }),
    };
  }
};

function parseCSV(text) {
  // Normalise line endings (Windows \r\n → \n)
  const lines = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = splitLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());

  return lines
    .slice(1)
    .map((line) => {
      const fields = splitLine(line);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (fields[i] || "").replace(/^"|"$/g, "").trim();
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v !== ""));
}

// Properly splits a CSV line respecting quoted fields that may contain commas
function splitLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Handle escaped quotes ""
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
