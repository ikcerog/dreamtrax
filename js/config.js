/* DreamTrax configuration — edit sources here. */
window.DREAMTRAX = {
  // queue-times.com park IDs for Walt Disney World Resort.
  parks: [
    { id: 6, name: "Magic Kingdom",      short: "MK",  lat: 28.4177, lng: -81.5812, color: "#5b8cff" },
    { id: 5, name: "EPCOT",              short: "EP",  lat: 28.3747, lng: -81.5494, color: "#b46bff" },
    { id: 7, name: "Hollywood Studios",  short: "HS",  lat: 28.3575, lng: -81.5601, color: "#34d399" },
    { id: 8, name: "Animal Kingdom",     short: "AK",  lat: 28.3553, lng: -81.5901, color: "#fbbf24" },
  ],

  // RSS news sources. Fetched client-side as raw XML and parsed in-browser.
  news: [
    { name: "Disney Parks Blog", url: "https://disneyparks.disney.go.com/blog/feed/" },
    { name: "AllEars",           url: "https://allears.net/feed/" },
    { name: "WDWNT",             url: "https://wdwnt.com/feed/" },
    { name: "WDW News Today",    url: "https://wdwnt.com/category/walt-disney-world/feed/" },
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
