# Bruins Game Tracker — Netlify Site

## Deploy
1. Zip this entire folder (or push to GitHub)
2. Drag-and-drop the zip onto app.netlify.com → "Deploy manually"
3. Done — your site is live!

## One-time setup after deploy
The Netlify function (`netlify/functions/fetch-games.js`) already has your Google Sheet URL hardcoded.
No extra config needed.

## Updating data
Just edit your Google Sheet — the site re-fetches it live (cached for 5 minutes).

## Column header mapping
The app tries common variations of column names. If your columns don't match, open
`netlify/functions/fetch-games.js` and find the `pick(...)` calls in `normalizeGame()`.
Add your exact header name to the list for each field.

Your current sheet columns expected:
- Date
- Opponent
- Home/Away
- Season Type (regular/pre/post)
- Final Score  (format: "4-2" works best)
- Win/Loss/OT  (W, L, or OT)
- Who I attended with
- Notes

## File structure
```
bruins-stats/
├── index.html                     ← entire frontend (all 5 tabs)
├── netlify.toml                   ← build config
├── README.md
└── netlify/
    └── functions/
        └── fetch-games.js         ← serverless CSV proxy
```
