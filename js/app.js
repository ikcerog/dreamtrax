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
    renderWaits();
    renderOverviewStats();
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
      <div><div class="name">${esc(r.name)}</div>
      <div class="park"><span style="color:${r.parkColor}">●</span> ${esc(r.park)}</div></div>
      <div class="wait-badge ${cls}">${badge}</div></div>`;
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

  /* ---------- News ---------- */
  async function loadNews() {
    const items = [];
    await Promise.all(CFG.news.map(async (src) => {
      try {
        const res = await fetch(CFG.rssProxy(src.url));
        const data = await res.json();
        if (data.status !== "ok") throw new Error(data.message || "rss error");
        (data.items || []).forEach(it => items.push({
          source: src.name,
          title: it.title,
          link: it.link,
          date: it.pubDate,
          snippet: (it.description || "").replace(/<[^>]+>/g, "").slice(0, 180),
        }));
      } catch (e) {
        console.warn(`News failed for ${src.name}:`, e.message);
      }
    }));
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

  /* ---------- Refresh orchestration ---------- */
  async function refreshAll() {
    const btn = $("#refreshBtn");
    btn.disabled = true; btn.textContent = "↻ Loading…";
    await Promise.all([loadWaits(), loadNews()]);
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
