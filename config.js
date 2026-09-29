// ==========================================================================
// Aura Weather — Configuration & Settings
// ==========================================================================
// Safe for GitHub & Vercel deployment: No sensitive keys are hardcoded here.
// On Vercel, the API key is securely loaded from Vercel Environment Variables
// via the serverless function (/api/weather).
// ==========================================================================

const CONFIG = {
    // Left empty for public git commits.
    // Set OPENWEATHER_API_KEY in Vercel Project Settings > Environment Variables.
    API_KEY: "",

    // OpenWeatherMap API Base URL
    BASE_URL: "https://api.openweathermap.org/data/2.5",

    // Default Location Mode: "current" (auto GPS/IP) or city name
    DEFAULT_LOCATION: "current",

    // Default Temperature Unit: "metric" or "imperial"
    DEFAULT_UNIT: "metric",

    // High-Precision Free Weather & Geocoding Endpoints
    OPEN_METEO_GEO_URL: "https://geocoding-api.open-meteo.com/v1/search",
    OPEN_METEO_WEATHER_URL: "https://api.open-meteo.com/v1/forecast",

    // IP Geolocation Fallbacks for automatic default location detection
    IP_GEO_URL: "https://ipapi.co/json/",
    IP_GEO_FALLBACK_URL: "https://ipwho.is/",

    /**
     * Get active API key (from localStorage, .env, or default)
     */
    getKey() {
        const stored = localStorage.getItem("weather_api_key");
        if (stored && stored.trim()) return stored.trim();
        return this.API_KEY;
    },

    /**
     * Set API key programmatically (optional local override)
     */
    setKey(newKey) {
        if (newKey && newKey.trim()) {
            localStorage.setItem("weather_api_key", newKey.trim());
            this.API_KEY = newKey.trim();
        }
    },

    /**
     * Asynchronously load from .env file when served via local HTTP server
     */
    async loadEnv() {
        if (window.location.protocol === "file:") return;
        try {
            const res = await fetch(".env");
            if (!res.ok) return;
            const text = await res.text();
            for (const line of text.split("\n")) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) continue;
                const [key, ...values] = trimmed.split("=");
                const val = values.join("=").trim().replace(/^["']|["']$/g, "");

                const k = key.trim();
                if (k === "OPENWEATHER_API_KEY" || k === "VITE_OPENWEATHER_API_KEY" || k === "API_KEY") {
                    if (val && !localStorage.getItem("weather_api_key")) {
                        this.API_KEY = val;
                    }
                }
                if (k === "WEATHER_API_URL") this.BASE_URL = val;
                if (k === "DEFAULT_LOCATION") this.DEFAULT_LOCATION = val;
                if (k === "DEFAULT_UNIT") this.DEFAULT_UNIT = val;
                if (k === "IP_GEO_URL") this.IP_GEO_URL = val;
                if (k === "IP_GEO_FALLBACK_URL") this.IP_GEO_FALLBACK_URL = val;
            }
        } catch (e) {
            // Silently continue
        }
    }
};

CONFIG.loadEnv();
