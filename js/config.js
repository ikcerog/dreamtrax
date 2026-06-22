/* DreamTrax configuration — edit sources here. */
window.DREAMTRAX = {
  // queue-times.com park IDs for Walt Disney World Resort.
  parks: [
    { id: 6, name: "Magic Kingdom",      short: "MK",  lat: 28.4177, lng: -81.5812, color: "#5b8cff" },
    { id: 5, name: "EPCOT",              short: "EP",  lat: 28.3747, lng: -81.5494, color: "#b46bff" },
    { id: 7, name: "Hollywood Studios",  short: "HS",  lat: 28.3575, lng: -81.5601, color: "#34d399" },
    { id: 8, name: "Animal Kingdom",     short: "AK",  lat: 28.3553, lng: -81.5901, color: "#fbbf24" },
  ],

  // RSS news sources. Fetched client-side via a free RSS->JSON proxy (no key needed).
  news: [
    { name: "Disney Parks Blog", url: "https://disneyparks.disney.go.com/blog/feed/" },
    { name: "AllEars",           url: "https://allears.net/feed/" },
    { name: "WDWNT",             url: "https://wdwnt.com/feed/" },
    { name: "WDW News Today",    url: "https://wdwnt.com/category/walt-disney-world/feed/" },
  ],

  // Free, no-key RSS->JSON proxy. CORS-enabled.
  rssProxy: (url) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=12`,

  queueApi: (parkId) => `https://queue-times.com/parks/${parkId}/queue_times.json`,

  refreshMs: 5 * 60 * 1000, // auto-refresh live data every 5 minutes
};
