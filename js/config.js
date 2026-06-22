/* DreamTrax configuration — edit sources here. */
window.DREAMTRAX = {
  // Parks. IDs below are sensible fallbacks, but DreamTrax resolves the real
  // queue-times ID at runtime from parks.json by matching name (+ company, to
  // disambiguate the two "Disneyland Park"s in Anaheim vs Paris). This keeps the
  // sources verified and immune to ID changes.
  parksIndexUrl: "https://queue-times.com/parks.json",
  parks: [
    // Walt Disney World Resort (Florida / Eastern time)
    { id: 6,  short: "MK",  resort: "WDW", name: "Magic Kingdom",      nameMatch: "magic kingdom",       companyMatch: "walt disney world", lat: 28.4177, lng: -81.5812, color: "#5b8cff" },
    { id: 5,  short: "EP",  resort: "WDW", name: "EPCOT",              nameMatch: "epcot",               companyMatch: "walt disney world", lat: 28.3747, lng: -81.5494, color: "#b46bff" },
    { id: 7,  short: "HS",  resort: "WDW", name: "Hollywood Studios",  nameMatch: "hollywood studios",   companyMatch: "walt disney world", lat: 28.3575, lng: -81.5601, color: "#34d399" },
    { id: 8,  short: "AK",  resort: "WDW", name: "Animal Kingdom",     nameMatch: "animal kingdom",      companyMatch: "walt disney world", lat: 28.3553, lng: -81.5901, color: "#fbbf24" },
    // Disneyland Resort (California / Pacific time)
    { id: 16, short: "DL",  resort: "DLR", name: "Disneyland Park",    nameMatch: "disneyland park",     companyMatch: "disneyland resort", lat: 33.8121, lng: -117.9190, color: "#f472b6" },
    { id: 17, short: "DCA", resort: "DLR", name: "California Adventure", nameMatch: "california adventure", companyMatch: "disneyland resort", lat: 33.8060, lng: -117.9221, color: "#38bdf8" },
  ],

  // Resorts (for map focus, filtering, weather, crowd & airport modules).
  resorts: [
    { id: "WDW", name: "Walt Disney World", center: [28.385, -81.563], zoom: 12,
      tz: "America/New_York", lat: 28.385, lng: -81.563, city: "Lake Buena Vista, FL",
      airport: "MCO", airportName: "Orlando Intl (MCO)",
      roads: [
        { label: "FL511 Traffic", url: "https://fl511.com/" },
        { label: "MCO Airport", url: "https://orlandoairports.net/" },
      ] },
    { id: "DLR", name: "Disneyland", center: [33.809, -117.918], zoom: 14,
      tz: "America/Los_Angeles", lat: 33.809, lng: -117.918, city: "Anaheim, CA",
      airport: "SNA", airportName: "John Wayne / Orange County (SNA)",
      roads: [
        { label: "Caltrans QuickMap", url: "https://quickmap.dot.ca.gov/" },
        { label: "SNA Airport", url: "https://www.ocair.com/" },
      ] },
  ],

  // News sources via Google News RSS `site:` queries. Clicks route through Google
  // to the original article, so the publishers keep their ad revenue — and Google
  // News is a reliable, CORS-friendly feed host. `when:7d` keeps it fresh.
  googleNews: (query) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:7d")}&hl=en-US&gl=US&ceid=US:en`,
  news: [
    { name: "Disney Parks Blog", query: "site:disneyparks.disney.go.com" },
    { name: "AllEars",           query: "site:allears.net" },
    { name: "WDW News Today",    query: "site:wdwnt.com" },
    { name: "Disney Parks News", query: '"Walt Disney World" OR "Disneyland" theme park' },
  ],

  // Fallback chain of free, no-key CORS proxies. Each takes an encoded URL and
  // returns the raw feed body. We try them in order until one succeeds — this is
  // what makes the news wire robust against any single proxy being rate-limited.
  corsProxies: [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  ],

  queueApi: (parkId) => `https://queue-times.com/parks/${parkId}/queue_times.json`,

  // Open-Meteo — free, no API key. Built per-resort so the card follows the toggle.
  weatherUrl(resort) {
    const p = new URLSearchParams({
      latitude: resort.lat, longitude: resort.lng,
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day",
      daily: "sunrise,sunset,precipitation_probability_max,temperature_2m_max,temperature_2m_min,uv_index_max",
      temperature_unit: "fahrenheit", wind_speed_unit: "mph", precipitation_unit: "inch",
      timezone: resort.tz, forecast_days: "1",
    });
    return `https://api.open-meteo.com/v1/forecast?${p}`;
  },

  // FAA Airport Status (free, no key). Routed via the CORS-proxy chain.
  faaStatus: (code) => `https://soa.smext.faa.gov/asws/api/airport/status/${code}`,

  // Mini TV Station — public-domain / freely-shared channels (YouTube nocookie).
  tvChannels: [
    { name: "Steamboat Willie ’28", yt: "BBgghnQF6E4" }, // Disney official, public domain
    { name: "Resort TV Info",       yt: "-LqPzc9bYe0" }, // courtesy WDW Today
  ],

  // Ticket pricing. No free/official Disney price API exists, so DreamTrax models
  // Disney's published date-based pricing structure (base + weekend/seasonal tiers)
  // as an ILLUSTRATIVE series, and self-records each day's value to localStorage so
  // the history becomes real observations over time. Drop verified data into
  // window.DREAMTRAX_TICKETS to override the model.
  tickets: {
    resorts: {
      WDW: { label: "Walt Disney World", base: 109, color: "#5b8cff" },
      DLR: { label: "Disneyland",        base: 104, color: "#f472b6" },
    },
    seasonAdd: { weekend: 25, summer: 35, holiday: 45, springBreak: 30 }, // $ adders
    tiers: [
      { name: "Value",   max: 130, color: "#34d399" },
      { name: "Regular", max: 165, color: "#fbbf24" },
      { name: "Peak",    max: 999, color: "#f87171" },
    ],
    disclaimer: "Ticket prices model Disney's published date-based pricing structure and are illustrative estimates for trend visualization — not official quotes. Always confirm at disneyworld.disney.go.com / disneyland.disney.go.com. DreamTrax records each day's value locally so the history becomes real over time.",
  },

  // Discover tab — free, royalty-free, public-domain sources (no keys, CORS-OK).
  discover: {
    // Wikipedia article titles per park (CC BY-SA text + Commons thumbnails).
    wiki: {
      MK: "Magic Kingdom", EP: "Epcot", HS: "Disney's Hollywood Studios",
      AK: "Disney's Animal Kingdom", DL: "Disneyland", DCA: "Disney California Adventure",
    },
    wikiSummary: (title) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    // Wikimedia Commons "Picture of the day" style feed — freely-licensed media.
    commonsSearch: (q) =>
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search` +
      `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
      `&iiprop=url|extmetadata&iiurlwidth=480`,
    // Internet Archive: Steamboat Willie (1928) — public domain since 2024-01-01.
    archiveItem: "SteamboatWillie",
    archiveCollectionUrl: "https://archive.org/details/disney",
  },

  pulseHistory: 12,          // wait-time snapshots kept in localStorage (~1h at 5-min refresh)
  refreshMs: 5 * 60 * 1000,  // auto-refresh live data every 5 minutes

  version: "1.5.1",
  patchNotes: [
    { v: "1.5.1", date: "2026-06-22", notes: [
      "Moved Mini TV Station to the Radio & TV tab; retired the non-working radio player",
      "Overview row now ends with the Getting There card",
    ]},
    { v: "1.5.0", date: "2026-06-22", notes: [
      "Weather now follows the resort toggle (Orlando ↔ Anaheim)",
      "Overview expanded to three columns: + Crowd Forecast, Mini TV Station, Getting There",
      "Mini TV Station with switchable public-domain channels (fixes Steamboat Willie)",
      "Getting There card: FAA airport status + traffic links",
      "Fixed spacing between stacked cards on Discover/other tabs",
    ]},
    { v: "1.4.0", date: "2026-06-22", notes: [
      "New Discover tab: Park Encyclopedia via Wikipedia + Wikimedia Commons photos",
      "Vintage Vault: public-domain Steamboat Willie (1928) via the Internet Archive",
      "Fonts: Raleway (sans) + Merriweather (serif headings)",
    ]},
    { v: "1.3.0", date: "2026-06-22", notes: [
      "Park IDs now resolved live from queue-times to fix Disneyland/DCA showing closed",
      "Overview resort toggle (All / Walt Disney World / Disneyland)",
      "Per-park data status: distinguishes Closed vs No live data",
      "Version chip with these patch notes",
    ]},
    { v: "1.2.0", date: "2026-06-22", notes: [
      "Added Disneyland Resort parks with live waits + map resort toggle",
      "News switched to Google News RSS so publishers keep ad revenue",
    ]},
    { v: "1.1.0", date: "2026-06-22", notes: [
      "Robust news wire: multi-proxy raw RSS/Atom parsing",
      "Park Pulse: local wait-trend tracking + crowd momentum",
      "Weather & Golden Hour via Open-Meteo",
    ]},
    { v: "1.0.0", date: "2026-06-22", notes: [
      "Initial DreamTrax: wait times, park map, news, radio & resort TV",
    ]},
  ],
};
