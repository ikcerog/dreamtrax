/* DreamTrax — live Walt Disney World dashboard logic. Vanilla JS, no build step. */
(() => {
  "use strict";
  const CFG = window.DREAMTRAX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = {
    rides: [],          // {name, wait, isOpen, park, parkColor}
    news: [],           // {source, title, link, date, snippet}
    parkFilter: "all",
    newsFilter: "all",
    map: null,
    fetchedAt: null,
  };

  /* ---------- Tabs ---------- */
  $$(".tab").forEach(tab => tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.remove("active"));
    $$(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $("#" + tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "map" && state.map) setTimeout(() => state.map.invalidateSize(), 60);
  }));

  function showTab(name) {
    const tab = $(`.tab[data-tab="${name}"]`);
    if (tab) tab.click();
  }

  /* ---------- Theme ---------- */
  const savedTheme = localStorage.getItem("dt-theme");
  if (savedTheme) document.body.dataset.theme = savedTheme;
  $("#themeBtn").addEventListener("click", () => {
    const next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    localStorage.setItem("dt-theme", next);
  });

  /* ---------- Clock (Orlando / ET) ---------- */
  function tickClock() {
    try {
      const t = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/New_York", hour: "2-digit", minute: "2-digit",
      });
      $("#clock").textContent = `🕒 ${t} ET`;
    } catch { /* ignore */ }
  }
  tickClock(); setInterval(tickClock, 30000);

  /* ---------- Helpers ---------- */
  const waitClass = (w, open) => !open ? "w-closed" : w <= 25 ? "w-low" : w <= 60 ? "w-mid" : "w-high";
  const esc = (s) => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const timeAgo = (d) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.round(ms / 60000);
    if (isNaN(m)) return "";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  };

  /* ---------- Park Pulse (original): local trend tracking ----------
     We snapshot every ride's wait into localStorage on each refresh. Comparing
     "now" to ~20-40 min ago lets us show whether a line is climbing or dropping
     and gauge each park's momentum — no paid/historical API required. */
  const rideKey = (r) => `${r.parkShort}|${r.name}`;
  function loadPulse() {
    try { return JSON.parse(localStorage.getItem("dt-pulse") || "[]"); } catch { return []; }
  }
  function snapshotPulse() {
    const snaps = loadPulse();
    const waits = {};
    state.rides.forEach(r => { if (r.isOpen) waits[rideKey(r)] = r.wait; });
    snaps.push({ t: Date.now(), waits });
    while (snaps.length > CFG.pulseHistory) snaps.shift();
    localStorage.setItem("dt-pulse", JSON.stringify(snaps));
    state.pulse = snaps;
  }
  // Trend for a ride vs the oldest snapshot >=20 min old (else oldest available).
  function rideTrend(r) {
    const snaps = state.pulse || [];
    if (snaps.length < 2) return 0;
    const cutoff = Date.now() - 20 * 60000;
    const past = snaps.find(s => s.t <= cutoff) || snaps[0];
    const prev = past.waits[rideKey(r)];
    if (prev == null || !r.isOpen) return 0;
    return r.wait - prev; // minutes change
  }
  function trendBadge(delta) {
    if (!delta) return "";
    const up = delta > 0;
    return `<span class="trend ${up ? "up" : "down"}" title="${up ? "Rising" : "Falling"} ${Math.abs(delta)} min in ~20 min">${up ? "▲" : "▼"} ${Math.abs(delta)}</span>`;
  }
  // Per-park momentum: avg wait now vs ~20 min ago + crowd label from avg wait.
  function parkPulse(short) {
    const rides = state.rides.filter(r => r.parkShort === short && r.isOpen);
    if (!rides.length) return null;
    const avg = rides.reduce((s, r) => s + r.wait, 0) / rides.length;
    const deltas = rides.map(rideTrend).filter(d => d !== 0);
    const momentum = deltas.length ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const level = avg <= 20 ? { t: "Low", c: "var(--good)", p: 25 }
                : avg <= 35 ? { t: "Moderate", c: "var(--warn)", p: 55 }
                : avg <= 55 ? { t: "Busy", c: "#fb923c", p: 80 }
                : { t: "Packed", c: "var(--bad)", p: 100 };
    return { avg: Math.round(avg), level, momentum, open: rides.length };
  }

  /* ---------- Wait times ---------- */
  async function loadWaits() {
    const all = [];
    await Promise.all(CFG.parks.map(async (park) => {
      try {
        const res = await fetch(CFG.queueApi(park.id));
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const rides = [
          ...(data.rides || []),
          ...((data.lands || []).flatMap(l => l.rides || [])),
        ];
        rides.forEach(r => all.push({
          name: r.name,
          wait: r.wait_time ?? 0,
          isOpen: !!r.is_open,
          park: park.name,
          parkShort: park.short,
          parkColor: park.color,
        }));
      } catch (e) {
        console.warn(`Wait times failed for ${park.name}:`, e.message);
      }
    }));
    state.rides = all;
    snapshotPulse();
    renderWaits();
    renderOverviewStats();
    renderParkPulse();
    renderParkMarkers();
  }

  function renderParkFilters() {
    const wrap = $("#parkFilters");
    const pills = [{ short: "all", name: "All Parks" }, ...CFG.parks];
    wrap.innerHTML = pills.map(p =>
      `<button class="pill ${p.short === state.parkFilter ? "active" : ""}" data-park="${p.short}">${esc(p.name)}</button>`
    ).join("");
    $$("#parkFilters .pill").forEach(b => b.addEventListener("click", () => {
      state.parkFilter = b.dataset.park; renderParkFilters(); renderWaits();
    }));
  }

  function currentWaitRows() {
    let rows = state.rides.slice();
    if (state.parkFilter !== "all") rows = rows.filter(r => r.parkShort === state.parkFilter);
    const q = $("#waitSearch")?.value.trim().toLowerCase();
    if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q));
    if ($("#openOnly")?.checked) rows = rows.filter(r => r.isOpen);
    const sort = $("#waitSort")?.value || "wait-desc";
    rows.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) :
      sort === "wait-asc" ? (a.wait - b.wait) : (b.wait - a.wait));
    return rows;
  }

  function rideRowHTML(r) {
    const cls = waitClass(r.wait, r.isOpen);
    const badge = r.isOpen ? `${r.wait}<small> min</small>` : "Closed";
    return `<div class="ride-row">
      <div><div class="name">${esc(r.name)} ${trendBadge(rideTrend(r))}</div>
      <div class="park"><span style="color:${r.parkColor}">●</span> ${esc(r.park)}</div></div>
      <div class="wait-badge ${cls}">${badge}</div></div>`;
  }

  function renderParkPulse() {
    const wrap = $("#parkPulse");
    if (!wrap) return;
    const rows = CFG.parks.map(p => {
      const pulse = parkPulse(p.short);
      if (!pulse) return `<div class="pulse-row"><span class="pulse-name">${esc(p.name)}</span>
        <span class="muted">Closed</span></div>`;
      const arrow = pulse.momentum > 1 ? `<span class="trend up">▲ rising</span>`
                  : pulse.momentum < -1 ? `<span class="trend down">▼ easing</span>`
                  : `<span class="trend flat">▬ steady</span>`;
      return `<div class="pulse-row">
        <span class="pulse-name"><span style="color:${p.color}">●</span> ${esc(p.short)}</span>
        <div class="pulse-bar"><i style="width:${pulse.level.p}%;background:${pulse.level.c}"></i></div>
        <span class="pulse-meta"><b style="color:${pulse.level.c}">${pulse.level.t}</b> · ${pulse.avg}m ${arrow}</span>
      </div>`;
    }).join("");
    wrap.innerHTML = rows;
  }

  function renderWaits() {
    renderParkFilters();
    const rows = currentWaitRows();
    $("#waitList").innerHTML = rows.length
      ? rows.map(rideRowHTML).join("")
      : `<p class="muted">No rides match. Live data may be temporarily unavailable.</p>`;
  }

  function renderOverviewStats() {
    const open = state.rides.filter(r => r.isOpen);
    const openParks = new Set(open.map(r => r.park));
    $("#statParks").textContent = `${openParks.size}/${CFG.parks.length}`;
    if (open.length) {
      const avg = Math.round(open.reduce((s, r) => s + r.wait, 0) / open.length);
      $("#statAvg").textContent = `${avg} min`;
      const sorted = open.slice().sort((a, b) => a.wait - b.wait);
      const short = sorted[0], long = sorted[sorted.length - 1];
      $("#statShort").textContent = `${short.name}`;
      $("#statShortPark").textContent = `${short.wait} min · ${short.park}`;
      $("#statLong").textContent = `${long.name}`;
      $("#statLongPark").textContent = `${long.wait} min · ${long.park}`;
    } else {
      $("#statAvg").textContent = "—";
    }
    // Top waits on overview
    const top = open.slice().sort((a, b) => b.wait - a.wait).slice(0, 6);
    $("#overviewWaits").innerHTML = top.length
      ? top.map(rideRowHTML).join("")
      : `<p class="muted">Wait times unavailable right now.</p>`;
  }

  /* ---------- News ----------
     Robust: fetch the raw RSS/Atom XML through a fallback chain of free CORS
     proxies, then parse in-browser. If one proxy is rate-limited/down we move
     to the next, so a single flaky proxy no longer blanks the whole wire. */
  async function fetchFeedText(feedUrl) {
    for (const proxy of CFG.corsProxies) {
      try {
        const res = await fetch(proxy(feedUrl), { headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" } });
        if (!res.ok) continue;
        const text = await res.text();
        if (text && /<(rss|feed|rdf:RDF)/i.test(text)) return text;
      } catch { /* try next proxy */ }
    }
    return null;
  }

  function parseFeed(xmlText, sourceName) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    if (doc.querySelector("parsererror")) return [];
    const txt = (el, sel) => el.querySelector(sel)?.textContent?.trim() || "";
    // RSS <item> first, fall back to Atom <entry>.
    const nodes = [...doc.querySelectorAll("item")];
    if (nodes.length) {
      return nodes.map(n => ({
        source: sourceName,
        title: txt(n, "title"),
        link: txt(n, "link"),
        date: txt(n, "pubDate") || txt(n, "date"),
        snippet: (txt(n, "description")).replace(/<[^>]+>/g, "").slice(0, 180),
      }));
    }
    return [...doc.querySelectorAll("entry")].map(n => ({
      source: sourceName,
      title: txt(n, "title"),
      link: n.querySelector("link")?.getAttribute("href") || txt(n, "link"),
      date: txt(n, "updated") || txt(n, "published"),
      snippet: (txt(n, "summary") || txt(n, "content")).replace(/<[^>]+>/g, "").slice(0, 180),
    }));
  }

  async function loadNews() {
    const batches = await Promise.all(CFG.news.map(async (src) => {
      const xml = await fetchFeedText(src.url);
      if (!xml) { console.warn(`News: all proxies failed for ${src.name}`); return []; }
      return parseFeed(xml, src.name).filter(i => i.title && i.link);
    }));
    const items = batches.flat();
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    state.news = items;
    renderNews();
  }

  function renderNewsFilters() {
    const wrap = $("#newsFilters");
    const names = ["all", ...new Set(state.news.map(n => n.source))];
    wrap.innerHTML = names.map(n =>
      `<button class="pill ${n === state.newsFilter ? "active" : ""}" data-src="${esc(n)}">${n === "all" ? "All Sources" : esc(n)}</button>`
    ).join("");
    $$("#newsFilters .pill").forEach(b => b.addEventListener("click", () => {
      state.newsFilter = b.dataset.src; renderNewsFilters(); renderNews();
    }));
  }

  function newsItemHTML(n) {
    return `<article class="news-item">
      <span class="src">${esc(n.source)}</span>
      <h4><a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a></h4>
      <div class="meta">${timeAgo(n.date)}</div>
      <p>${esc(n.snippet)}…</p>
    </article>`;
  }

  function renderNews() {
    renderNewsFilters();
    let rows = state.news;
    if (state.newsFilter !== "all") rows = rows.filter(n => n.source === state.newsFilter);
    $("#newsList").innerHTML = rows.length
      ? rows.map(newsItemHTML).join("")
      : `<p class="muted">No headlines loaded. The RSS proxy may be rate-limited — try Refresh in a moment.</p>`;
    $("#overviewNews").innerHTML = state.news.slice(0, 6).map(n =>
      `<a class="news-item" style="text-decoration:none;display:block" href="${esc(n.link)}" target="_blank" rel="noopener">
        <span class="src">${esc(n.source)}</span>
        <h4 style="margin:4px 0 2px">${esc(n.title)}</h4>
        <div class="meta">${timeAgo(n.date)}</div></a>`
    ).join("") || `<p class="muted">No headlines yet.</p>`;
  }

  /* ---------- Map ---------- */
  function initMap() {
    const map = L.map("leafletMap", { scrollWheelZoom: false }).setView([28.385, -81.563], 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    state.map = map;
    state.markers = {};
    CFG.parks.forEach(p => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 12, color: "#fff", weight: 2, fillColor: p.color, fillOpacity: .9,
      }).addTo(map);
      marker.bindTooltip(p.name, { permanent: false, direction: "top" });
      state.markers[p.short] = marker;
      marker.on("click", () => { state.parkFilter = p.short; renderWaits(); showTab("waits"); });
    });
  }

  function renderParkMarkers() {
    if (!state.map) return;
    CFG.parks.forEach(p => {
      const m = state.markers[p.short];
      if (!m) return;
      const rides = state.rides.filter(r => r.parkShort === p.short && r.isOpen);
      const avg = rides.length ? Math.round(rides.reduce((s, r) => s + r.wait, 0) / rides.length) : null;
      m.bindPopup(`<div class="popup-park"><h4>${esc(p.name)}</h4>
        <div class="muted">${rides.length} rides open${avg !== null ? ` · avg ${avg} min` : ""}</div>
        <button class="btn" onclick="window.__dtJump('${p.short}')">View wait times →</button></div>`);
    });
  }
  window.__dtJump = (short) => { state.parkFilter = short; renderWaits(); showTab("waits"); };

  /* ---------- Weather & Golden Hour (Open-Meteo, free / no key) ---------- */
  const WMO = {
    0:["Clear","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
    45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
    61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
    71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],
    80:["Showers","🌦️"],81:["Showers","🌧️"],82:["Violent showers","⛈️"],
    95:["Thunderstorm","⛈️"],96:["Storm + hail","⛈️"],99:["Severe storm","⛈️"],
  };
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const addHr = (iso, h) => fmtTime(new Date(new Date(iso).getTime() + h * 3600000).toISOString());

  async function loadWeather() {
    const el = $("#weatherCard");
    if (!el) return;
    try {
      const res = await fetch(CFG.weather.url());
      const d = await res.json();
      const c = d.current, day = d.daily;
      const [desc, emoji] = WMO[c.weather_code] || ["—","🌡️"];
      const rise = day.sunrise[0], set = day.sunset[0];
      // Golden hour ≈ first hour after sunrise and last hour before sunset.
      el.innerHTML = `
        <div class="wx-now">
          <span class="wx-emoji">${emoji}</span>
          <div><div class="wx-temp">${Math.round(c.temperature_2m)}°F</div>
          <div class="muted">${desc} · feels ${Math.round(c.apparent_temperature)}°</div></div>
        </div>
        <div class="wx-grid">
          <span>💧 ${c.relative_humidity_2m}% hum</span>
          <span>🌧️ ${day.precipitation_probability_max[0]}% rain</span>
          <span>💨 ${Math.round(c.wind_speed_10m)} mph</span>
          <span>🔆 UV ${Math.round(day.uv_index_max[0])}</span>
        </div>
        <div class="golden">
          <div>🌅 <b>Sunrise</b> ${fmtTime(rise)} <span class="muted">· golden ${fmtTime(rise)}–${addHr(rise,1)}</span></div>
          <div>🌇 <b>Sunset</b> ${fmtTime(set)} <span class="muted">· golden ${addHr(set,-1)}–${fmtTime(set)}</span></div>
        </div>`;
    } catch (e) {
      console.warn("Weather failed:", e.message);
      el.innerHTML = `<p class="muted">Weather temporarily unavailable.</p>`;
    }
  }

  /* ---------- Refresh orchestration ---------- */
  async function refreshAll() {
    const btn = $("#refreshBtn");
    btn.disabled = true; btn.textContent = "↻ Loading…";
    await Promise.all([loadWaits(), loadNews(), loadWeather()]);
    state.fetchedAt = new Date();
    $("#lastUpdated").textContent = state.fetchedAt.toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET";
    btn.disabled = false; btn.textContent = "↻ Refresh";
  }

  /* ---------- Wire up ---------- */
  ["waitSearch", "openOnly", "waitSort"].forEach(id =>
    $("#" + id)?.addEventListener("input", renderWaits));
  $("#refreshBtn").addEventListener("click", refreshAll);

  initMap();
  refreshAll();
  setInterval(refreshAll, CFG.refreshMs);
})();
