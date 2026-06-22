# ✦ DreamTrax

A live, interactive **Walt Disney World** dashboard — ride wait times, an interactive park map, the latest Disney news headlines, resort radio, and the in-room resort TV info channel. Modern aesthetic, zero build step, 100% free & open-source libraries.

> **Not affiliated with, endorsed by, or sponsored by The Walt Disney Company.** A fan-made project.

## ✨ Features

- **Live wait times** for **both resorts** — Walt Disney World (Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom) **and Disneyland** (Disneyland Park, California Adventure) — via the free [queue-times.com](https://queue-times.com) API, no key required.
- **Interactive park map** (Leaflet + OpenStreetMap/CARTO tiles) with a **WDW ↔ Disneyland toggle**. Click a park to jump to its live waits.
- **Disney news wire** via **Google News RSS** `site:` feeds for Disney Parks Blog, AllEars, and WDW News Today / WDWNT — clicks route through Google to the original article so **publishers keep their ad revenue** — filterable by source.
- **Overview** tab — a three-column desktop dashboard: stats (parks open, avg/shortest/longest wait), **resort-aware Weather & Golden Hour** (follows the WDW↔Disneyland toggle), **Park Pulse**, a **7-day Crowd Forecast**, top waits, headlines, a looping **Mini TV Station** (switchable public-domain channels), and a **Getting There** card with **FAA airport status + traffic links**.
- **💓 Park Pulse** *(original)* — DreamTrax snapshots wait times locally on every refresh, so it can show whether each ride's line is **▲ rising / ▼ falling** and gauge each park's live **crowd momentum** — no paid or historical API needed.
- **🌤️ Weather & Golden Hour** *(original)* — current resort conditions plus **sunrise/sunset golden-hour windows** for park photographers, via the free, key-less [Open-Meteo](https://open-meteo.com) API.
- **🎟️ Ticket price trends** — interactive [Chart.js](https://www.chartjs.org) line graph of 1-Day base ticket prices with **7/30/60/90-day** ranges and a **14-day pricing calendar** (Value/Regular/Peak tiers). No free Disney price API exists, so DreamTrax models Disney's published date-based pricing as an *illustrative* series and **self-records each day's value to `localStorage`** so the history becomes real over time (override via `window.DREAMTRAX_TICKETS`).
- **🔎 Self-verifying sources** — park IDs are resolved at runtime from queue-times' own `parks.json` by name, so the dashboard can't break on ID drift (this is what fixed Disneyland/DCA showing closed).
- **🎟️ Events banner** — live & upcoming festivals/parties (EPCOT festivals, Halloween/Christmas parties, Disneyland seasons) with countdowns; curated, clearly-labeled dates.
- **🚗 Live traffic map** — free, no-key **Waze** live-traffic embed in *Getting There*, with a Parks/Airport toggle, alongside FAA airport status.
- **🔥 Community Buzz** — trending posts from r/WaltDisneyWorld & r/Disneyland via Reddit's free JSON (used in place of the now paywalled X/Twitter API).
- **🏰 Discover tab** — a **Park Encyclopedia** (live Wikipedia REST summaries + Wikimedia Commons thumbnails for all six parks), a **freely-licensed Commons photo stream** (each image links to its source & license), and a **Vintage Vault** embedding the public-domain *Steamboat Willie* (1928) from the Internet Archive. All free, royalty-free, no keys, fully attributed.
- **Version chip** with in-app **patch notes**, and an **All / WDW / Disneyland** resort toggle on the Overview.
- **Sorcerer Radio** stream and the **Resort TV info channel** (replica courtesy of WDW Today).
- **Light/dark theme**, auto-refresh every 5 minutes, Orlando local clock.

### Why the news wire is robust
Rather than depending on one RSS-to-JSON service (which rate-limits), DreamTrax fetches each feed's **raw XML through a fallback chain of free CORS proxies** and parses it in-browser (`DOMParser`, RSS + Atom). If one proxy is down or throttled, it automatically tries the next.

## 🧱 Tech / sources (all free & open-source)

| Concern        | Tool / source |
|----------------|---------------|
| Map            | [Leaflet](https://leafletjs.com) + CARTO/OSM tiles |
| Wait times     | [queue-times.com](https://queue-times.com) JSON API |
| News           | Raw RSS/Atom via a fallback chain of free CORS proxies, parsed in-browser |
| Weather        | [Open-Meteo](https://open-meteo.com) (free, no key) |
| Encyclopedia   | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) + [Wikimedia Commons](https://commons.wikimedia.org) (CC BY-SA) |
| Vintage media  | [Internet Archive](https://archive.org) + public-domain YouTube |
| Airport status | [FAA ASWS](https://soa.smext.faa.gov) (free, no key) |
| Radio          | Sorcerer Radio public webcast |
| Resort TV      | YouTube embed (credit: WDW Today) |
| Charts         | [Chart.js](https://www.chartjs.org) |
| Fonts          | Raleway (sans) + Merriweather (serif), Google Fonts |

No backend, no API keys, no build tooling — just static files.

## 🚀 Run it

Because browsers block `fetch` from `file://`, serve the folder over HTTP:

```bash
# any one of these from the repo root:
python3 -m http.server 8080
npx serve .
```

Then open <http://localhost:8080>.

### Deploy free with GitHub Pages
**Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root.** Your dashboard goes live at `https://ikcerog.github.io/dreamtrax/`.

## 🤖 Claude assistant (@claude) in this repo

1. Install the Claude GitHub App: <https://github.com/apps/claude> (or run `/install-github-app` in the Claude Code CLI) and grant access to this repo.
2. Add repo secret `ANTHROPIC_API_KEY` under **Settings → Secrets and variables → Actions**.
3. The workflow at [`.github/workflows/claude.yml`](.github/workflows/claude.yml) is already included. Tag **`@claude`** in any issue or PR comment to invoke it.

## ⚙️ Configuration

Edit [`js/config.js`](js/config.js) to add/remove parks or news sources, or change the refresh interval. queue-times.com park IDs and RSS feed URLs both live there.

## 📝 Credits & attribution

- Wait-time data: **queue-times.com**
- News: **Disney Parks Blog**, **AllEars**, **WDW News Today / WDWNT** (headlines link back to original articles)
- Radio: **Sorcerer Radio**
- Resort TV channel video: **WDW Today** — all rights to the original creator
- Map data: **© OpenStreetMap contributors, © CARTO**

## ⚖️ License

[MIT](LICENSE) for the DreamTrax code. Third-party content, data, and trademarks belong to their respective owners.
