/* DreamTrax configuration — edit sources here. */
window.DREAMTRAX = {
  // queue-times.com park IDs. Two resorts; live data for whichever is open.
  parks: [
    // Walt Disney World Resort (Florida / Eastern time)
    { id: 6, name: "Magic Kingdom",          short: "MK",  resort: "WDW", lat: 28.4177, lng: -81.5812, color: "#5b8cff" },
    { id: 5, name: "EPCOT",                   short: "EP",  resort: "WDW", lat: 28.3747, lng: -81.5494, color: "#b46bff" },
    { id: 7, name: "Hollywood Studios",       short: "HS",  resort: "WDW", lat: 28.3575, lng: -81.5601, color: "#34d399" },
    { id: 8, name: "Animal Kingdom",          short: "AK",  resort: "WDW", lat: 28.3553, lng: -81.5901, color: "#fbbf24" },
    // Disneyland Resort (California / Pacific time)
    { id: 16, name: "Disneyland Park",        short: "DL",  resort: "DLR", lat: 33.8121, lng: -117.9190, color: "#f472b6" },
    { id: 17, name: "California Adventure",    short: "DCA", resort: "DLR", lat: 33.8060, lng: -117.9221, color: "#38bdf8" },
  ],

  // Resorts (for map focus + filtering).
  resorts: [
    { id: "WDW", name: "Walt Disney World", center: [28.385, -81.563], zoom: 12, tz: "America/New_York" },
    { id: "DLR", name: "Disneyland",        center: [33.809, -117.918], zoom: 14, tz: "America/Los_Angeles" },
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

  // Open-Meteo — free, no API key. Resort-area coordinates (near Seven Seas Lagoon).
  weather: {
    lat: 28.385, lng: -81.563,
    url(){
      const p = new URLSearchParams({
        latitude: this.lat, longitude: this.lng,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day",
        daily: "sunrise,sunset,precipitation_probability_max,temperature_2m_max,temperature_2m_min,uv_index_max",
        temperature_unit: "fahrenheit", wind_speed_unit: "mph", precipitation_unit: "inch",
        timezone: "America/New_York", forecast_days: "1",
      });
      return `https://api.open-meteo.com/v1/forecast?${p}`;
    },
  },

  pulseHistory: 12,          // wait-time snapshots kept in localStorage (~1h at 5-min refresh)
  refreshMs: 5 * 60 * 1000,  // auto-refresh live data every 5 minutes
};
