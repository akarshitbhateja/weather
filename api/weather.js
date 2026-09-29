// ==============================================================================
// Vercel Serverless Function: /api/weather
// ==============================================================================
// Secure backend proxy for OpenWeatherMap API requests.
// Keeps OPENWEATHER_API_KEY 100% secret on Vercel servers.
// Never exposes the key to the client browser or public GitHub repository.
// ==============================================================================

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { q, lat, lon, units = "metric" } = req.query;

    // Securely read from Vercel Environment Variables
    const apiKey = process.env.OPENWEATHER_API_KEY || 
                   process.env.VITE_OPENWEATHER_API_KEY || 
                   process.env.API_KEY;

    if (!apiKey) {
        return res.status(503).json({
            error: "OPENWEATHER_API_KEY is not configured in Vercel Environment Variables.",
            fallback: true
        });
    }

    // Cache responses for 10 minutes at Vercel's edge network
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");

    try {
        let currentUrl = "";
        let forecastUrl = "";

        if (lat !== undefined && lon !== undefined) {
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
        } else if (q) {
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=${units}&appid=${apiKey}`;
        } else {
            return res.status(400).json({ error: "Missing query parameter 'q' or 'lat'/'lon'" });
        }

        const currentRes = await fetch(currentUrl);
        const currentData = await currentRes.json();

        if (!currentRes.ok) {
            return res.status(currentRes.status).json({
                error: currentData.message || "Failed to fetch from OpenWeatherMap",
                cod: currentData.cod,
                fallback: true
            });
        }

        // If city query, fetch forecast using resolved coordinates
        if (!forecastUrl && currentData.coord) {
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&units=${units}&appid=${apiKey}`;
        }

        let forecastData = null;
        if (forecastUrl) {
            const forecastRes = await fetch(forecastUrl);
            if (forecastRes.ok) {
                forecastData = await forecastRes.json();
            }
        }

        return res.status(200).json({
            current: currentData,
            forecast: forecastData,
            source: "openweather-proxy"
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message || "Serverless proxy error",
            fallback: true
        });
    }
};
