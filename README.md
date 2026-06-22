# ✦ DreamTrax

A live, interactive **Walt Disney World** dashboard — ride wait times, an interactive park map, the latest Disney news headlines, resort radio, and the in-room resort TV info channel. Modern aesthetic, zero build step, 100% free & open-source libraries.

> **Not affiliated with, endorsed by, or sponsored by The Walt Disney Company.** A fan-made project.

## ✨ Features

- **Live wait times** for **both resorts** — Walt Disney World (Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom) **and Disneyland** (Disneyland Park, California Adventure) — via the free [queue-times.com](https://queue-times.com) API, no key required.
- **Interactive park map** (Leaflet + OpenStreetMap/CARTO tiles) with a **WDW ↔ Disneyland toggle**. Click a park to jump to its live waits.
- **Disney news wire** via **Google News RSS** `site:` feeds for Disney Parks Blog, AllEars, and WDW News Today / WDWNT — clicks route through Google to the original article so **publishers keep their ad revenue** — filterable by source.
- **Overview** tab with at-a-glance stats: parks open, average wait, shortest & longest standby right now.
- **💓 Park Pulse** *(original)* — DreamTrax snapshots wait times locally on every refresh, so it can show whether each ride's line is **▲ rising / ▼ falling** and gauge each park's live **crowd momentum** — no paid or historical API needed.
- **🌤️ Weather & Golden Hour** *(original)* — current resort conditions plus **sunrise/sunset golden-hour windows** for park photographers, via the free, key-less [Open-Meteo](https://open-meteo.com) API.
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
| Radio          | Sorcerer Radio public webcast |
| Resort TV      | YouTube embed (credit: WDW Today) |
| Fonts          | Inter (Google Fonts) |

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
