# Packey — Personal Adventures Site

A site logging personal adventures — weddings attended, concerts been to, and
places lived — backed by one Google Sheet (one tab per category).

## Structure
```
packeyapp/
├── index.html                        ← home page, links to each category
├── weddings/index.html               ← wedding entries (Weddings tab)
├── concerts/index.html               ← concert entries (Concerts tab)
├── living-situations/index.html      ← living situation entries (Living tab)
├── hockey/                           ← Bruins attendance tracker (formerly its own site)
│   ├── index.html                   ← shares the top nav, has its own gold-themed sub-nav below it
│   ├── css/style.css                ← hockey's original styles, scoped under .hockey-app
│   └── js/app.js                    ← hockey's original app logic (Player Stats tab removed)
├── css/style.css                     ← shared styles (rust theme)
├── js/app.js                         ← fetches + renders entries client-side
├── netlify/functions/fetch-sheet.js  ← proxies a wedding/concert/living sheet tab as JSON
├── netlify/functions/fetch-games.js  ← proxies the hockey Google Sheet as JSON
├── netlify/functions/espn-game.js    ← proxies NHL/ESPN game data for the hockey section
├── data/wedding-locations.json       ← cached geocoding results for the wedding map
├── data/concert-locations.json       ← cached geocoding results for the concert map
├── scripts/geocode-weddings.js       ← regenerates the file above (npm run geocode:weddings)
├── scripts/geocode-concerts.js       ← regenerates the concert locations (npm run geocode:concerts)
├── server.js                         ← local dev server (emulates all three functions)
└── netlify.toml
```

### The Hockey section
Hockey used to be a separate deployment (`packey.netlify.app`) with its own
header. It's now folded in as `hockey/index.html`: the shared Home/Weddings/
Concerts/Living Situations/Hockey nav renders at the top on every page as
usual, and everything below it — the gold theme, the sub-nav (Overview, Game
Log, Map, etc.), stat cards, tables — is the original hockey app, untouched
except for the removed Player Stats tab. Its CSS is scoped under a
`.hockey-app` wrapper class so it can't bleed onto the other pages (which use
the rust theme), and vice versa. Its JS only loads on `hockey/index.html`,
so there's no risk of it colliding with the rest of the site's script.

## Adding an entry
Open the sheet via the "Edit Sheet" link on each category page and add a row.
The site re-fetches it live (cached 5 minutes via HTTP caching). Column
headers per tab, matched exactly by `js/app.js`:

- **Weddings**: Date, Whose Wedding, Connection, Plus 1, Location, Official Album, Google Album
- **Concerts**: Date, Band, Opening Act, Tour, Location, Guest, Set List
- **Living**: Start Date, End Date, Years, Duration, Address, Roomates

If you rename a column, update the matching field name in `js/app.js`.

## Known limitation: hyperlink columns
"Official Album", "Google Album", and "Set List" cells that show as
clickable text in Google Sheets (Insert → Link) only export their *visible
text* as CSV — Google Sheets' CSV export doesn't include the underlying URL.
Because of that, the app currently doesn't render those as links. If you
want a clickable link in the app, put the raw URL as the cell's plain text
instead of a rich-text link.

## Wedding map
The Weddings page shows a Leaflet map above the table with a pin per venue.
Since Google Sheets has no coordinate data, addresses are geocoded ahead of
time (via OpenStreetMap's Nominatim) into `data/wedding-locations.json`,
keyed by `Date|Whose Wedding`. After adding new weddings to the sheet, run:
```
npm run geocode:weddings
```
This only geocodes rows missing from the cache (add `--force` to redo all of
them), then commit the updated JSON file. Rows without a resolvable address
just won't get a pin — the table still lists them.

## Concert map
Same idea as the wedding map, but keyed by venue name instead of per-show,
since the same venue shows up across multiple concerts — `data/concert-
locations.json` is keyed by the exact `Location` cell text rather than
`Date|Band`, so repeat venues (TD Garden, Xfinity Center, etc.) are only
geocoded once. Regenerate after adding new venues with:
```
npm run geocode:concerts
```
Nominatim occasionally matches a same-named venue in the wrong city (this
happened with "The Sinclair" and "Xfinity Center" when first generating this
file — it matched venues in Chicago and Maryland instead of the Cambridge/
Mansfield, MA ones). Always skim the OK lines it prints; if one looks wrong,
either edit `data/concert-locations.json` directly with the correct
coordinates, or make the sheet's Location cell more specific (add a city/
state) and re-run.

## Local preview
```
npm start
```
Then open http://localhost:3000. This runs a small Node server that serves
the static pages and also emulates the Netlify function locally.

## Deploy
1. Push this folder to GitHub (or zip it)
2. Connect the repo on app.netlify.com (or drag-and-drop the zip under "Deploy manually")
3. Done — publish directory is `.`, function directory is `netlify/functions`.

Both Google Sheet tabs must stay shared as "Anyone with the link – Viewer"
for the function to fetch them without authentication.
