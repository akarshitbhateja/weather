/* ==============================================================================
   AURA WEATHER — Precision Meteorological Application Controller
   Luxury Minimalist Editorial Experience with Multi-Tier Auto-Failover
   ============================================================================== */

'use strict';

// ── Application State ──
const state = {
    unit: 'C', // 'C' | 'F'
    theme: 'light', // 'light' | 'dark'
    graphMode: 'temp', // 'temp' | 'precip' | 'wind'
    isCurrentLocation: false,
    currentLat: null,
    currentLon: null,
    currentCity: null,
    currentCountry: null,
    currentCountryCode: null,
    timezoneOffsetSec: 0,
    timezoneName: 'auto',
    rawData: null,
    activeProvider: 'Auto-Detect',
};

// ── DOM References ──
const $ = (id) => document.getElementById(id);
const el = {
    weatherContent: $('weatherContent'),
    loadingState: $('loadingState'),
    loadingMessage: $('loadingMessage'),
    errorState: $('errorState'),
    errorMessage: $('errorMessage'),
    retryBtn: $('retryBtn'),

    // Hero
    cityName: $('cityName'),
    countryBadge: $('countryBadge'),
    currentLocBadge: $('currentLocBadge'),
    weatherDate: $('weatherDate'),
    localTime: $('localTime'),
    weatherDesc: $('weatherDesc'),
    heroSvgIcon: $('heroSvgIcon'),
    tempValue: $('tempValue'),
    tempUnit: $('tempUnit'),
    feelsLike: $('feelsLike'),
    tempMax: $('tempMax'),
    tempMin: $('tempMin'),
    weatherInsightText: $('weatherInsightText'),

    // Atmospheric Trend Graph
    graphModeSub: $('graphModeSub'),
    trendSvg: $('trendSvg'),
    trendLinePath: $('trendLinePath'),
    trendAreaPath: $('trendAreaPath'),
    trendPointsGroup: $('trendPointsGroup'),
    trendLabelsGroup: $('trendLabelsGroup'),
    trendTimeLabels: $('trendTimeLabels'),

    // Hourly
    hourlyList: $('hourlyList'),
    hourlyPrev: $('hourlyPrev'),
    hourlyNext: $('hourlyNext'),

    // Metrics
    humidity: $('humidity'),
    humidityBar: $('humidityBar'),
    humiditySub: $('humiditySub'),
    windSpeed: $('windSpeed'),
    windCompassIcon: $('windCompassIcon'),
    windDirBadge: $('windDirBadge'),
    windBar: $('windBar'),
    windSub: $('windSub'),
    aqiVal: $('aqiVal'),
    aqiBadge: $('aqiBadge'),
    aqiBar: $('aqiBar'),
    aqiSub: $('aqiSub'),
    uvIndex: $('uvIndex'),
    uvBadge: $('uvBadge'),
    uvBar: $('uvBar'),
    uvSub: $('uvSub'),
    visibility: $('visibility'),
    visibilityBar: $('visibilityBar'),
    visibilitySub: $('visibilitySub'),
    pressure: $('pressure'),
    pressureBar: $('pressureBar'),
    pressureSub: $('pressureSub'),
    precipitationProb: $('precipitationProb'),
    precipitationBar: $('precipitationBar'),
    precipitationSub: $('precipitationSub'),
    dewPointVal: $('dewPointVal'),
    dewPointSub: $('dewPointSub'),
    cloudCoverBadge: $('cloudCoverBadge'),
    cloudCoverBar: $('cloudCoverBar'),

    // Sun & Solar Cycle
    sunrise: $('sunrise'),
    sunset: $('sunset'),
    solarStatus: $('solarStatus'),
    daylightSummary: $('daylightSummary'),
    sunArcProgress: $('sunArcProgress'),
    sunMarkerGroup: $('sunMarkerGroup'),

    // Moon Cycle
    moonIllumination: $('moonIllumination'),
    moonGlyphWrap: $('moonGlyphWrap'),
    moonPhaseName: $('moonPhaseName'),
    moonPhaseAge: $('moonPhaseAge'),

    // 5-Day Forecast
    forecastGrid: $('forecastGrid'),

    // Lifestyle Advisory
    tipsOutdoorTitle: $('tipsOutdoorTitle'),
    tipsOutdoorDesc: $('tipsOutdoorDesc'),
    tipsClothingTitle: $('tipsClothingTitle'),
    tipsClothingDesc: $('tipsClothingDesc'),
    tipsUvTitle: $('tipsUvTitle'),
    tipsUvDesc: $('tipsUvDesc'),

    // Search, Theme & Navigation
    themeToggleBtn: $('themeToggleBtn'),
    searchContainer: $('searchContainer'),
    searchInput: $('searchInput'),
    clearBtn: $('clearBtn'),
    suggestionsList: $('suggestionsList'),
    locateMeBtn: $('locateMeBtn'),
    btnCurrentLocation: $('btnCurrentLocation'),
    btnRefresh: $('btnRefresh'),
    btnCelsius: $('btnCelsius'),
    btnFahrenheit: $('btnFahrenheit'),
    quickCities: $('quickCities'),
};

// ── Temperature & Metric Helpers ──
function cToF(c) {
    return Math.round((c * 9) / 5 + 32);
}

function formatTemp(c) {
    if (c === null || c === undefined || isNaN(c)) return '—';
    const val = state.unit === 'F' ? cToF(c) : Math.round(c);
    return `${val}°`;
}

function formatRawTempNum(c) {
    if (c === null || c === undefined || isNaN(c)) return '—';
    return state.unit === 'F' ? cToF(c) : Math.round(c);
}

function getWindCardinal(deg) {
    if (deg === null || deg === undefined) return 'N';
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round((deg % 360) / 45) % 8;
    return cardinals[idx];
}

// ── Crisp Minimalist SVG Weather Glyphs ──
function getWeatherSvg(code, isDay = true, size = 32) {
    const s = size;
    const strCode = String(code);

    const icons = {
        clearDay: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
        </svg>`,
        clearNight: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`,
        partlyCloudyDay: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M19.07 4.93l-1.41 1.41"></path>
            <path d="M15.5 8A4.5 4.5 0 0 0 9 10.5"></path>
            <path d="M17.5 19H9a5 5 0 0 1 0-10c.2 0 .4 0 .6.03A5.5 5.5 0 0 1 20 14.5a4.5 4.5 0 0 1-2.5 4.5z"></path>
        </svg>`,
        partlyCloudyNight: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 6.5A5.5 5.5 0 0 0 9 10.5"></path>
            <path d="M17.5 19H9a5 5 0 0 1 0-10c.2 0 .4 0 .6.03A5.5 5.5 0 0 1 20 14.5a4.5 4.5 0 0 1-2.5 4.5z"></path>
        </svg>`,
        cloudy: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.5 19H9a5 5 0 0 1 0-10c.2 0 .4 0 .6.03A5.5 5.5 0 0 1 20 14.5a4.5 4.5 0 0 1-2.5 4.5z"></path>
        </svg>`,
        rain: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 13a4 4 0 0 0-8 0"></path>
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
            <line x1="8" y1="19" x2="8" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
            <line x1="16" y1="19" x2="16" y2="21"></line>
        </svg>`,
        heavyRain: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
            <line x1="8" y1="17" x2="6" y2="22"></line>
            <line x1="12" y1="17" x2="10" y2="22"></line>
            <line x1="16" y1="17" x2="14" y2="22"></line>
        </svg>`,
        thunderstorm: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 16.3"></path>
            <polyline points="13 11 9 17 15 17 11 23"></polyline>
        </svg>`,
        snow: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
            <line x1="8" y1="19" x2="8" y2="19.01"></line>
            <line x1="12" y1="21" x2="12" y2="21.01"></line>
            <line x1="16" y1="19" x2="16" y2="19.01"></line>
        </svg>`,
        fog: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="14" x2="20" y2="14"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
            <line x1="4" y1="10" x2="20" y2="10"></line>
        </svg>`
    };

    // wttr / WorldWeatherOnline code mapping
    const wttrRain = ['176', '263', '266', '281', '284', '293', '296', '299', '302', '305', '308', '311', '314', '353', '356', '359'];
    const wttrSnow = ['227', '230', '320', '323', '326', '329', '332', '335', '338', '350', '368', '371'];
    const wttrStorm = ['200', '386', '389', '392', '395'];
    const wttrFog = ['143', '248', '260', '134'];

    if (strCode === '113') return isDay ? icons.clearDay : icons.clearNight;
    if (strCode === '116') return isDay ? icons.partlyCloudyDay : icons.partlyCloudyNight;
    if (strCode === '119' || strCode === '122') return icons.cloudy;
    if (wttrRain.includes(strCode)) return icons.rain;
    if (wttrStorm.includes(strCode)) return icons.thunderstorm;
    if (wttrSnow.includes(strCode)) return icons.snow;
    if (wttrFog.includes(strCode)) return icons.fog;

    // OpenWeather & Open-Meteo codes
    if (code === '01d' || code === 0) return icons.clearDay;
    if (code === '01n') return icons.clearNight;
    if (code === '02d' || code === 1 || code === 2) return isDay ? icons.partlyCloudyDay : icons.partlyCloudyNight;
    if (code === '02n') return icons.partlyCloudyNight;
    if (code === '03d' || code === '03n' || code === '04d' || code === '04n' || code === 3) return icons.cloudy;
    if (code === '09d' || code === '09n' || [51, 53, 55, 61, 80].includes(code)) return icons.rain;
    if (code === '10d' || code === '10n' || [63, 65, 81, 82].includes(code)) return icons.heavyRain;
    if (code === '11d' || code === '11n' || [95, 96, 99].includes(code)) return icons.thunderstorm;
    if (code === '13d' || code === '13n' || [71, 73, 75, 77, 85, 86].includes(code)) return icons.snow;
    if (code === '50d' || code === '50n' || [45, 48].includes(code)) return icons.fog;

    return isDay ? icons.partlyCloudyDay : icons.partlyCloudyNight;
}

// ── Time & Date Utilities ──
function getDestinationDate(timezoneOffsetSec) {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + timezoneOffsetSec * 1000);
}

function formatDestinationDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatDestinationTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }) + ' Local Time';
}

function formatHourLabel(d) {
    const h = d.getHours();
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function getDayLabel(d, isFirstDay = false) {
    if (isFirstDay) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// ── UI State Switcher ──
function setViewState(view) {
    el.loadingState.style.display = view === 'loading' ? 'flex' : 'none';
    el.errorState.style.display = view === 'error' ? 'flex' : 'none';
    el.weatherContent.style.display = view === 'weather' ? 'grid' : 'none';
}

// ── Dark Mode Controller ──
function initTheme() {
    const savedTheme = localStorage.getItem('aura-theme');
    if (savedTheme) {
        state.theme = savedTheme;
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.theme = prefersDark ? 'dark' : 'light';
    }
    applyTheme(state.theme);
}

function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura-theme', theme);

    // Update Theme Toggle Button Icon
    if (theme === 'dark') {
        el.themeToggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
        el.themeToggleBtn.title = 'Switch to Light Mode';
    } else {
        el.themeToggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
        el.themeToggleBtn.title = 'Switch to Dark Mode';
    }

    if (state.rawData) {
        renderTrendGraph(state.rawData.data.hourly);
    }
}

el.themeToggleBtn.addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
});

// ── Lunar Cycle Calculator ──
function calculateMoonPhase(date = new Date()) {
    const synodicMonth = 29.53058867;
    const refNewMoon = new Date('2024-01-11T11:57:00Z').getTime() / 1000;
    const nowSec = date.getTime() / 1000;
    const diffDays = (nowSec - refNewMoon) / 86400;
    const cycle = (diffDays % synodicMonth + synodicMonth) % synodicMonth;
    const fraction = cycle / synodicMonth;

    let name = '';
    if (fraction < 0.03 || fraction > 0.97) name = 'New Moon';
    else if (fraction < 0.22) name = 'Waxing Crescent';
    else if (fraction < 0.28) name = 'First Quarter';
    else if (fraction < 0.47) name = 'Waxing Gibbous';
    else if (fraction < 0.53) name = 'Full Moon';
    else if (fraction < 0.72) name = 'Waning Gibbous';
    else if (fraction < 0.78) name = 'Last Quarter';
    else name = 'Waning Crescent';

    const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) / 2 * 100);
    return { name, illumination, fraction, ageDays: cycle.toFixed(1) };
}

function renderMoonPhase(date = new Date()) {
    const moon = calculateMoonPhase(date);
    el.moonIllumination.textContent = `${moon.illumination}% Illumination`;
    el.moonPhaseName.textContent = moon.name;
    el.moonPhaseAge.textContent = `Lunar age: ${moon.ageDays} days in cycle`;

    const isWaning = moon.fraction > 0.5;
    const curveR = Math.cos(moon.fraction * 2 * Math.PI) * 18;
    const sweep = isWaning ? 0 : 1;

    el.moonGlyphWrap.innerHTML = `
        <svg viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="18" stroke="var(--border-medium)" stroke-width="2" fill="var(--bg-surface)" />
            <path d="M 22 4 A 18 18 0 0 ${sweep} 22 40 A ${Math.abs(curveR)} 18 0 0 ${curveR >= 0 ? sweep : (sweep === 1 ? 0 : 1)} 22 4" fill="var(--text-primary)" opacity="0.9" />
        </svg>
    `;
}

// ── Geocoding Service ──
async function searchGeocoding(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(r => ({
        name: r.name,
        country: r.country || '',
        countryCode: (r.country_code || '').toUpperCase(),
        lat: r.latitude,
        lon: r.longitude,
        timezone: r.timezone || 'auto'
    }));
}

async function reverseGeocodeCoords(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const a = data.address || {};
        return {
            name: a.city || a.town || a.village || a.suburb || a.county || 'Your Area',
            country: a.country || '',
            countryCode: (a.country_code || '').toUpperCase()
        };
    } catch {
        return { name: 'Current Location', country: '', countryCode: '' };
    }
}

// ── Multi-Tier Weather API Providers ──

// Tier 1: Vercel Serverless Function Proxy (/api/weather)
async function fetchFromVercelProxy(lat, lon) {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
    const data = await res.json();
    if (data.fallback) throw new Error('API key not configured in Vercel');
    return data;
}

// Tier 2: Open-Meteo High-Resolution (Free, zero-key, full forecast + dew point + wind dir)
async function fetchFromOpenMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,visibility,dew_point_2m,cloud_cover` +
        `&hourly=temperature_2m,weather_code,relative_humidity_2m,precipitation_probability,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
        `&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo request failed');
    return res.json();
}

// Tier 3: wttr.in Global Weather API (Free, zero-key, CORS supported)
async function fetchFromWttrIn(lat, lon) {
    const url = `https://wttr.in/${lat},${lon}?format=j1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wttr.in request failed: ${res.status}`);
    return res.json();
}

// Air Quality API (Open-Meteo)
async function fetchAirQuality(lat, lon) {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const d = await res.json();
        return d.current || null;
    } catch {
        return null;
    }
}

// ── Parsers ──
function parseOpenMeteoResponse(m, aqi) {
    const c = m.current;
    const daily = m.daily || {};
    const hourly = m.hourly || {};
    const tzOffset = m.utc_offset_seconds || 0;

    const forecastDays = (daily.time || []).slice(0, 5).map((t, i) => ({
        date: new Date(t).getTime() / 1000,
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        code: daily.weather_code[i],
        description: wmoCodeToText(daily.weather_code[i])
    }));

    const nowTs = Date.now();
    const hourlyList = (hourly.time || []).map((t, i) => ({
        time: new Date(t).getTime() / 1000,
        temp: hourly.temperature_2m[i],
        code: hourly.weather_code[i],
        pop: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
        wind: hourly.wind_speed_10m ? hourly.wind_speed_10m[i] : 10
    })).filter(h => h.time * 1000 >= nowTs - 3600000).slice(0, 24);

    const sunriseTs = daily.sunrise && daily.sunrise[0] ? new Date(daily.sunrise[0]).getTime() / 1000 : null;
    const sunsetTs = daily.sunset && daily.sunset[0] ? new Date(daily.sunset[0]).getTime() / 1000 : null;

    return {
        temp: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[0] : c.temperature_2m + 2,
        tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[0] : c.temperature_2m - 2,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        windDirection: c.wind_direction_10m || 0,
        windGusts: c.wind_gusts_10m || (c.wind_speed_10m * 1.3),
        pressure: c.surface_pressure,
        visibility: (c.visibility || 10000) / 1000,
        uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : 3,
        precipitationProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0,
        dewPoint: c.dew_point_2m !== undefined ? c.dew_point_2m : (c.temperature_2m - ((100 - c.relative_humidity_2m) / 5)),
        cloudCover: c.cloud_cover !== undefined ? c.cloud_cover : 20,
        aqi: aqi ? aqi.us_aqi : null,
        pm25: aqi ? aqi.pm2_5 : null,
        pm10: aqi ? aqi.pm10 : null,
        code: c.weather_code,
        description: wmoCodeToText(c.weather_code),
        sunrise: sunriseTs,
        sunset: sunsetTs,
        timezoneOffsetSec: tzOffset,
        hourly: hourlyList,
        forecast: forecastDays,
        provider: 'Open-Meteo'
    };
}

function parseOpenWeatherResponse(d, aqi) {
    const cur = d.current;
    const fcast = d.forecast;
    const tzOffset = cur.timezone || 0;

    const dailyMap = {};
    (fcast?.list || []).forEach(item => {
        const dateKey = new Date((item.dt + tzOffset) * 1000).toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = {
                date: item.dt,
                minTemps: [],
                maxTemps: [],
                codes: [],
                descs: []
            };
        }
        dailyMap[dateKey].minTemps.push(item.main.temp_min);
        dailyMap[dateKey].maxTemps.push(item.main.temp_max);
        dailyMap[dateKey].codes.push(item.weather[0].icon);
        dailyMap[dateKey].descs.push(item.weather[0].description);
    });

    const forecastDays = Object.values(dailyMap).slice(0, 5).map(day => ({
        date: day.date,
        tempMin: Math.min(...day.minTemps),
        tempMax: Math.max(...day.maxTemps),
        code: day.codes[0],
        description: day.descs[0]
    }));

    const hourlyList = (fcast?.list || []).slice(0, 16).map(item => ({
        time: item.dt,
        temp: item.main.temp,
        code: item.weather[0].icon,
        pop: Math.round((item.pop || 0) * 100),
        wind: item.wind ? item.wind.speed * 3.6 : 10
    }));

    const dewPointCalc = cur.main.temp - ((100 - cur.main.humidity) / 5);

    return {
        temp: cur.main.temp,
        feelsLike: cur.main.feels_like,
        tempMax: cur.main.temp_max,
        tempMin: cur.main.temp_min,
        humidity: cur.main.humidity,
        windSpeed: cur.wind.speed * 3.6,
        windDirection: cur.wind.deg || 0,
        windGusts: cur.wind.gust ? cur.wind.gust * 3.6 : cur.wind.speed * 4.5,
        pressure: cur.main.pressure,
        visibility: (cur.visibility || 10000) / 1000,
        uvIndex: 4,
        precipitationProb: fcast?.list?.[0]?.pop ? Math.round(fcast.list[0].pop * 100) : 0,
        dewPoint: dewPointCalc,
        cloudCover: cur.clouds ? cur.clouds.all : 25,
        aqi: aqi ? aqi.us_aqi : null,
        pm25: aqi ? aqi.pm2_5 : null,
        pm10: aqi ? aqi.pm10 : null,
        code: cur.weather[0].icon,
        description: cur.weather[0].description,
        sunrise: cur.sys.sunrise,
        sunset: cur.sys.sunset,
        timezoneOffsetSec: tzOffset,
        hourly: hourlyList,
        forecast: forecastDays,
        provider: 'OpenWeatherMap'
    };
}

function parseWttrResponse(data, aqi) {
    const cur = data.current_condition ? data.current_condition[0] : {};
    const weatherDays = data.weather || [];
    const today = weatherDays[0] || {};
    const astro = today.astronomy ? today.astronomy[0] : {};

    const parseTimeStr = (str) => {
        if (!str) return null;
        const parts = str.trim().split(' ');
        if (!parts[0]) return null;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return Math.floor(d.getTime() / 1000);
    };

    const sunrise = parseTimeStr(astro.sunrise);
    const sunset = parseTimeStr(astro.sunset);

    const allHourly = [];
    weatherDays.forEach((day, dayIdx) => {
        (day.hourly || []).forEach(h => {
            const hourNum = parseInt(h.time, 10) / 100;
            const d = new Date();
            d.setDate(d.getDate() + dayIdx);
            d.setHours(hourNum, 0, 0, 0);
            allHourly.push({
                time: Math.floor(d.getTime() / 1000),
                temp: parseFloat(h.tempC),
                code: h.weatherCode,
                pop: parseInt(h.chanceofrain || '0', 10),
                wind: parseFloat(h.windspeedKmph || '10')
            });
        });
    });

    const nowSec = Math.floor(Date.now() / 1000);
    const hourlyList = allHourly.filter(h => h.time >= nowSec - 3600).slice(0, 24);

    const forecastDays = weatherDays.slice(0, 5).map((w, idx) => {
        const d = new Date();
        d.setDate(d.getDate() + idx);
        const midHour = w.hourly && w.hourly[4] ? w.hourly[4] : (w.hourly && w.hourly[0] ? w.hourly[0] : {});
        return {
            date: Math.floor(d.getTime() / 1000),
            tempMax: parseFloat(w.maxtempC),
            tempMin: parseFloat(w.mintempC),
            code: midHour.weatherCode || '113',
            description: midHour.weatherDesc && midHour.weatherDesc[0] ? midHour.weatherDesc[0].value.trim() : 'Fair'
        };
    });

    const tempVal = parseFloat(cur.temp_C || '20');
    const humVal = parseFloat(cur.humidity || '50');

    return {
        temp: tempVal,
        feelsLike: parseFloat(cur.FeelsLikeC || cur.temp_C),
        tempMax: parseFloat(today.maxtempC || cur.temp_C),
        tempMin: parseFloat(today.mintempC || cur.temp_C),
        humidity: humVal,
        windSpeed: parseFloat(cur.windspeedKmph || '12'),
        windDirection: parseFloat(cur.winddirDegree || 0),
        windGusts: parseFloat(cur.windspeedKmph || '12') * 1.3,
        pressure: parseFloat(cur.pressure || '1013'),
        visibility: parseFloat(cur.visibility || '10'),
        uvIndex: parseFloat(cur.uvIndex || '4'),
        precipitationProb: parseInt(cur.precipMM || '0', 10) > 0 ? 80 : (hourlyList[0] ? hourlyList[0].pop : 0),
        dewPoint: tempVal - ((100 - humVal) / 5),
        cloudCover: parseFloat(cur.cloudcover || '20'),
        aqi: aqi ? aqi.us_aqi : null,
        pm25: aqi ? aqi.pm2_5 : null,
        pm10: aqi ? aqi.pm10 : null,
        code: cur.weatherCode || '113',
        description: cur.weatherDesc && cur.weatherDesc[0] ? cur.weatherDesc[0].value.trim() : 'Clear Sky',
        sunrise,
        sunset,
        timezoneOffsetSec: 0,
        hourly: hourlyList,
        forecast: forecastDays,
        provider: 'wttr.in'
    };
}

function wmoCodeToText(code) {
    const map = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy Mist',
        48: 'Depositing Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow Fall',
        73: 'Moderate Snow Fall',
        75: 'Heavy Snow Fall',
        77: 'Snow Grains',
        80: 'Passing Showers',
        81: 'Moderate Showers',
        82: 'Violent Showers',
        85: 'Slight Snow Showers',
        86: 'Heavy Snow Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Severe Thunderstorm'
    };
    return map[code] || 'Scattered Clouds';
}

// ── Weather Narratives & Lifestyle Insights ──
function generateAtmosphericInsight(data) {
    const temp = data.temp;
    const pop = data.precipitationProb;
    const wind = data.windSpeed;
    const uv = data.uvIndex;
    const desc = data.description.toLowerCase();

    if (pop > 60 || desc.includes('rain') || desc.includes('thunderstorm')) {
        return `Precipitation active. Wet surfaces and reduced visibility expected through the period.`;
    }
    if (temp > 32) {
        return `Elevated ambient temperatures. Maintain hydration and avoid direct noon solar exposure.`;
    }
    if (temp < 8) {
        return `Crisp, cold conditions. Thermal layering strongly recommended for outdoor exposure.`;
    }
    if (wind > 35) {
        return `High wind velocity detected. Expect turbulent atmospheric drag outdoors.`;
    }
    if (uv >= 7) {
        return `Intense ultraviolet radiation. High SPF sun protection necessary during daylight.`;
    }
    return `Stable atmospheric equilibrium. Highly comfortable for outdoor movement and leisure.`;
}

function updateLifestyleAdvisory(data) {
    const temp = data.temp;
    const pop = data.precipitationProb;
    const uv = data.uvIndex;
    const wind = data.windSpeed;

    // 1. Outdoor Activities
    if (pop > 50) {
        el.tipsOutdoorTitle.textContent = 'Indoor Preference';
        el.tipsOutdoorDesc.textContent = 'Rain likely. Ideal for gym training, reading, or indoor creative work.';
    } else if (wind > 35) {
        el.tipsOutdoorTitle.textContent = 'Moderate Resistance';
        el.tipsOutdoorDesc.textContent = 'Strong wind gusts. Running or cycling will face noticeable aerodynamic drag.';
    } else if (temp >= 15 && temp <= 26) {
        el.tipsOutdoorTitle.textContent = 'Ideal Conditions';
        el.tipsOutdoorDesc.textContent = 'Perfect thermal balance for distance running, walking, or outdoor sports.';
    } else {
        el.tipsOutdoorTitle.textContent = 'Acceptable Outdoors';
        el.tipsOutdoorDesc.textContent = 'Decent weather. Check local wind chill before prolonged exposure.';
    }

    // 2. Clothing Advice
    if (temp < 5) {
        el.tipsClothingTitle.textContent = 'Heavy Thermal Layers';
        el.tipsClothingDesc.textContent = 'Insulated winter parka, thermal innerwear, gloves, and knit beanie.';
    } else if (temp < 15) {
        el.tipsClothingTitle.textContent = 'Layered Outerwear';
        el.tipsClothingDesc.textContent = 'Mid-weight jacket, light sweater, or trench coat over casual wear.';
    } else if (temp < 25) {
        el.tipsClothingTitle.textContent = 'Light Casual Attire';
        el.tipsClothingDesc.textContent = 'Breathable cotton shirt, chinos or denim. Comfortable baseline.';
    } else {
        el.tipsClothingTitle.textContent = 'Minimalist Breathable';
        el.tipsClothingDesc.textContent = 'Linen shirts, loose cotton shorts, and breathable open footwear.';
    }

    // 3. Sun & UV Protection
    if (uv <= 2) {
        el.tipsUvTitle.textContent = 'Minimal UV Risk';
        el.tipsUvDesc.textContent = 'Low ultraviolet radiation. No special protective barrier required today.';
    } else if (uv <= 5) {
        el.tipsUvTitle.textContent = 'Moderate UV Exposure';
        el.tipsUvDesc.textContent = 'Wear sunglasses on bright days. SPF 15+ sunscreen if outdoors over 45 mins.';
    } else if (uv <= 7) {
        el.tipsUvTitle.textContent = 'High UV Shielding Required';
        el.tipsUvDesc.textContent = 'SPF 30+ broad-spectrum sunscreen, wide-brim hat, and UV400 sunglasses.';
    } else {
        el.tipsUvTitle.textContent = 'Very High / Extreme UV';
        el.tipsUvDesc.textContent = 'Seek shade during midday (11 AM - 3 PM). High SPF 50+ sun protection mandatory.';
    }
}

// ── Solar Arc Live Calculation (Corrected Geometry) ──
function updateSolarArc(sunriseTs, sunsetTs, tzOffsetSec) {
    if (!sunriseTs || !sunsetTs) {
        el.sunrise.textContent = '06:00 AM';
        el.sunset.textContent = '06:00 PM';
        el.daylightSummary.textContent = '12h 00m total';
        return;
    }

    const fmtTime = (ts) => {
        const d = new Date((ts + tzOffsetSec + new Date().getTimezoneOffset() * 60) * 1000);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    el.sunrise.textContent = fmtTime(sunriseTs);
    el.sunset.textContent = fmtTime(sunsetTs);

    const totalDaylightMs = (sunsetTs - sunriseTs) * 1000;
    const hours = Math.floor(totalDaylightMs / 3600000);
    const mins = Math.floor((totalDaylightMs % 3600000) / 60000);
    el.daylightSummary.textContent = `${hours}h ${mins}m Daylight`;

    const nowTs = Math.floor(Date.now() / 1000);
    let progressPct = (nowTs - sunriseTs) / (sunsetTs - sunriseTs);
    progressPct = Math.max(0, Math.min(1, progressPct));

    const isDay = nowTs >= sunriseTs && nowTs <= sunsetTs;
    el.solarStatus.textContent = isDay ? 'Daylight Active' : 'Night Cycle';

    const totalArcLen = 280;
    const strokeOffset = totalArcLen * (1 - progressPct);
    el.sunArcProgress.style.strokeDashoffset = strokeOffset;

    const angle = Math.PI - progressPct * Math.PI;
    const cx = 120;
    const rx = 100;
    const cy = 90;
    const ry = 75;

    const posX = cx + rx * Math.cos(angle);
    const posY = cy - ry * Math.sin(angle);

    el.sunMarkerGroup.setAttribute('transform', `translate(${posX.toFixed(1)}, ${posY.toFixed(1)})`);
}

// ── Interactive Atmospheric Trend Graph ──
function renderTrendGraph(hourly) {
    if (!hourly || !hourly.length) return;

    // Adaptive point count based on viewport width (prevents label collision on small mobile screens & expands for TV)
    const w = window.innerWidth;
    const targetPoints = w < 440 ? 5 : (w < 768 ? 7 : (w >= 1920 ? 14 : 10));
    const step = Math.max(1, Math.floor(hourly.length / targetPoints));
    const pointsData = [];
    for (let i = 0; i < hourly.length; i += step) {
        pointsData.push(hourly[i]);
    }
    if (pointsData[pointsData.length - 1] !== hourly[hourly.length - 1]) {
        pointsData.push(hourly[hourly.length - 1]);
    }

    let values = [];
    let unitLabel = '';

    if (state.graphMode === 'temp') {
        values = pointsData.map(p => state.unit === 'F' ? cToF(p.temp) : Math.round(p.temp));
        unitLabel = state.unit === 'F' ? '°F' : '°C';
        el.graphModeSub.textContent = `24-Hour Temperature Curve (${unitLabel})`;
    } else if (state.graphMode === 'precip') {
        values = pointsData.map(p => p.pop || 0);
        unitLabel = '%';
        el.graphModeSub.textContent = '24-Hour Precipitation Probability (%)';
    } else if (state.graphMode === 'wind') {
        values = pointsData.map(p => Math.round(p.wind || 10));
        unitLabel = ' km/h';
        el.graphModeSub.textContent = '24-Hour Wind Velocity (km/h)';
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = (maxVal - minVal) || 1;

    const svgW = 800;
    const svgH = 170;
    const paddingX = 40;
    const paddingTop = 36;
    const paddingBottom = 26;
    const innerW = svgW - paddingX * 2;
    const innerH = svgH - paddingTop - paddingBottom;

    const coords = pointsData.map((p, i) => {
        const x = paddingX + (i / (pointsData.length - 1)) * innerW;
        const normalized = (values[i] - minVal) / range;
        const y = paddingTop + (1 - normalized) * innerH;
        return { x, y, val: values[i], time: p.time };
    });

    let linePathD = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        linePathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const areaPathD = `${linePathD} L ${coords[coords.length - 1].x.toFixed(1)} ${svgH} L ${coords[0].x.toFixed(1)} ${svgH} Z`;

    el.trendLinePath.setAttribute('d', linePathD);
    el.trendAreaPath.setAttribute('d', areaPathD);

    let pointsHtml = '';
    let labelsHtml = '';

    coords.forEach((c) => {
        pointsHtml += `
            <circle class="trend-chart-point" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="var(--text-primary)" stroke="var(--bg-primary)" stroke-width="2">
                <title>${c.val}${unitLabel}</title>
            </circle>
        `;
        labelsHtml += `
            <text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-primary)" font-family="var(--font-sans)">
                ${c.val}${unitLabel === ' km/h' ? '' : unitLabel}
            </text>
        `;
    });

    el.trendPointsGroup.innerHTML = pointsHtml;
    el.trendLabelsGroup.innerHTML = labelsHtml;

    el.trendTimeLabels.innerHTML = coords.map((c, i) => {
        const d = new Date(c.time * 1000);
        const label = i === 0 ? 'Now' : formatHourLabel(d);
        return `<span>${label}</span>`;
    }).join('');
}

document.querySelectorAll('.graph-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.graph-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.graphMode = btn.dataset.mode;
        if (state.rawData) {
            renderTrendGraph(state.rawData.data.hourly);
        }
    });
});

// ── Render Complete Dashboard ──
function renderWeatherDashboard(data, geo) {
    state.rawData = { data, geo };

    // 1. Hero Header
    el.cityName.textContent = geo.name;
    el.countryBadge.textContent = geo.countryCode || geo.country || 'GLOBAL';
    el.currentLocBadge.style.display = state.isCurrentLocation ? 'inline-flex' : 'none';

    const destDate = getDestinationDate(data.timezoneOffsetSec);
    el.weatherDate.textContent = formatDestinationDate(destDate);
    el.localTime.textContent = formatDestinationTime(destDate);
    el.weatherDesc.textContent = data.description;

    // Weather Icon
    const isDaytime = data.sunrise && data.sunset
        ? Date.now() / 1000 >= data.sunrise && Date.now() / 1000 <= data.sunset
        : true;
    el.heroSvgIcon.innerHTML = getWeatherSvg(data.code, isDaytime, 100);

    // 2. Main Temperature Block
    el.tempValue.textContent = formatRawTempNum(data.temp);
    el.tempUnit.textContent = state.unit === 'F' ? '°F' : '°C';
    el.feelsLike.textContent = formatTemp(data.feelsLike);
    el.tempMax.textContent = formatTemp(data.tempMax);
    el.tempMin.textContent = formatTemp(data.tempMin);

    // Insight
    el.weatherInsightText.textContent = generateAtmosphericInsight(data);

    // 3. Interactive Trend Graph
    renderTrendGraph(data.hourly);

    // 4. Hourly Forecast
    renderHourlyList(data.hourly);

    // 5. Atmospheric Metrics Matrix (8 Cards)
    // Humidity
    el.humidity.textContent = `${data.humidity}%`;
    el.humidityBar.style.width = `${Math.min(100, Math.max(0, data.humidity))}%`;
    el.humiditySub.textContent = data.humidity < 35 ? 'Dry atmosphere' : data.humidity < 65 ? 'Optimum balance' : 'High moisture';

    // Wind & Compass
    const windSpeedKm = Math.round(data.windSpeed);
    el.windSpeed.textContent = `${windSpeedKm} km/h`;
    const windDir = data.windDirection || 0;
    el.windDirBadge.textContent = `${getWindCardinal(windDir)} · ${Math.round(windDir)}°`;
    el.windCompassIcon.style.transform = `rotate(${windDir}deg)`;
    const windPct = Math.min(100, (windSpeedKm / 80) * 100);
    el.windBar.style.width = `${windPct}%`;
    el.windSub.textContent = `Gusts up to ${Math.round(data.windGusts)} km/h`;

    // Air Quality Index (AQI)
    if (data.aqi !== null && data.aqi !== undefined) {
        el.aqiVal.textContent = data.aqi;
        const aqiPct = Math.min(100, (data.aqi / 300) * 100);
        el.aqiBar.style.width = `${aqiPct}%`;

        if (data.aqi <= 50) {
            el.aqiBadge.textContent = 'Good';
            el.aqiSub.textContent = `PM2.5: ${data.pm25 || '—'} · PM10: ${data.pm10 || '—'}`;
        } else if (data.aqi <= 100) {
            el.aqiBadge.textContent = 'Moderate';
            el.aqiSub.textContent = `PM2.5: ${data.pm25 || '—'} · PM10: ${data.pm10 || '—'}`;
        } else if (data.aqi <= 150) {
            el.aqiBadge.textContent = 'Sensitive';
            el.aqiSub.textContent = 'Unhealthy for sensitive groups';
        } else {
            el.aqiBadge.textContent = 'Unhealthy';
            el.aqiSub.textContent = `Elevated particulates (${data.pm25 || '—'} μg/m³)`;
        }
    } else {
        el.aqiVal.textContent = '38';
        el.aqiBadge.textContent = 'Good';
        el.aqiBar.style.width = '24%';
        el.aqiSub.textContent = 'Optimal air purity level';
    }

    // UV Index
    const uvVal = data.uvIndex !== null && data.uvIndex !== undefined ? data.uvIndex : '—';
    el.uvIndex.textContent = uvVal;
    const uvScore = typeof uvVal === 'number' ? uvVal : 3;
    el.uvBar.style.width = `${Math.min(100, (uvScore / 11) * 100)}%`;
    if (uvScore <= 2) {
        el.uvBadge.textContent = 'Low';
        el.uvSub.textContent = 'No protection needed';
    } else if (uvScore <= 5) {
        el.uvBadge.textContent = 'Moderate';
        el.uvSub.textContent = 'Cover at midday';
    } else if (uvScore <= 7) {
        el.uvBadge.textContent = 'High';
        el.uvSub.textContent = 'SPF 30+ recommended';
    } else {
        el.uvBadge.textContent = 'Very High';
        el.uvSub.textContent = 'Avoid prolonged sun';
    }

    // Visibility
    const visVal = Math.round(data.visibility * 10) / 10;
    el.visibility.textContent = `${visVal} km`;
    el.visibilityBar.style.width = `${Math.min(100, (visVal / 10) * 100)}%`;
    el.visibilitySub.textContent = visVal >= 10 ? 'Optimal transparency' : visVal >= 5 ? 'Fair clearance' : 'Fog or haze';

    // Pressure
    const pVal = Math.round(data.pressure);
    el.pressure.textContent = `${pVal} hPa`;
    const pressurePct = Math.min(100, Math.max(0, ((pVal - 960) / 80) * 100));
    el.pressureBar.style.width = `${pressurePct}%`;
    el.pressureSub.textContent = pVal > 1020 ? 'High barometric ridge' : pVal < 1005 ? 'Low pressure depression' : 'Normal atmospheric baseline';

    // Precipitation Risk
    const precipVal = data.precipitationProb || 0;
    el.precipitationProb.textContent = `${precipVal}%`;
    el.precipitationBar.style.width = `${precipVal}%`;
    el.precipitationSub.textContent = precipVal < 20 ? 'Dry forecast' : precipVal < 60 ? 'Scattered rain possible' : 'High likelihood of rain';

    // Dew Point & Cloud Cover
    el.dewPointVal.textContent = formatTemp(data.dewPoint);
    el.cloudCoverBadge.textContent = `Clouds: ${Math.round(data.cloudCover)}%`;
    el.cloudCoverBar.style.width = `${Math.min(100, Math.round(data.cloudCover))}%`;
    const dpComfort = data.dewPoint < 10 ? 'Dry and crisp' : data.dewPoint < 18 ? 'Comfortable' : 'Humid and muggy';
    el.dewPointSub.textContent = `Thermal Comfort: ${dpComfort}`;

    // 6. Solar Cycle
    updateSolarArc(data.sunrise, data.sunset, data.timezoneOffsetSec);

    // 7. Lunar Cycle
    renderMoonPhase(destDate);

    // 8. 5-Day Forecast
    renderForecastTable(data.forecast);

    // 9. Lifestyle Recommendations
    updateLifestyleAdvisory(data);

    // Switch View
    setViewState('weather');
}

// ── Render Hourly Slider ──
function renderHourlyList(hourly) {
    if (!hourly || !hourly.length) {
        el.hourlyList.innerHTML = `<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;">Hourly metrics unavailable</div>`;
        return;
    }

    el.hourlyList.innerHTML = hourly.map((item, index) => {
        const d = new Date(item.time * 1000);
        const isNow = index === 0;
        const timeLabel = isNow ? 'Now' : formatHourLabel(d);
        const tempStr = formatTemp(item.temp);
        const popStr = item.pop > 10 ? `${item.pop}%` : '';

        return `
            <div class="hourly-card ${isNow ? 'active' : ''}">
                <span class="hourly-time">${timeLabel}</span>
                <div class="hourly-glyph">
                    ${getWeatherSvg(item.code, true, 26)}
                </div>
                <span class="hourly-temp">${tempStr}</span>
                ${popStr ? `<span class="hourly-pop">${popStr}</span>` : ''}
            </div>
        `;
    }).join('');
}

// ── Render 5-Day Forecast Table ──
function renderForecastTable(forecast) {
    if (!forecast || !forecast.length) {
        el.forecastGrid.innerHTML = `<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;">Forecast metrics unavailable</div>`;
        return;
    }

    const allMins = forecast.map(f => f.tempMin);
    const allMaxs = forecast.map(f => f.tempMax);
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const totalRange = globalMax - globalMin || 1;

    el.forecastGrid.innerHTML = forecast.map((f, i) => {
        const d = new Date(f.date * 1000);
        const dayLabel = getDayLabel(d, i === 0);
        const isToday = i === 0;

        const lowTemp = formatTemp(f.tempMin);
        const highTemp = formatTemp(f.tempMax);

        const leftPct = Math.max(0, ((f.tempMin - globalMin) / totalRange) * 80).toFixed(1);
        const widthPct = Math.max(16, (((f.tempMax - f.tempMin) / totalRange) * 80 + 20)).toFixed(1);

        return `
            <div class="forecast-row ${isToday ? 'today' : ''}">
                <span class="fcast-day-name">${dayLabel}</span>
                <div class="fcast-glyph">
                    ${getWeatherSvg(f.code, true, 22)}
                </div>
                <div class="fcast-range-bar-wrap">
                    <span class="fcast-low-temp">${lowTemp}</span>
                    <div class="fcast-track">
                        <div class="fcast-fill" style="left: ${leftPct}%; width: ${widthPct}%;"></div>
                    </div>
                    <span class="fcast-high-temp">${highTemp}</span>
                </div>
                <span class="fcast-cond-short">${f.description}</span>
            </div>
        `;
    }).join('');
}

// ── Multi-Tier Primary Weather Fetch Controller (Auto-Failover) ──
async function loadWeatherData(lat, lon, geo) {
    setViewState('loading');
    el.loadingMessage.textContent = `Gathering atmospheric data for ${geo.name}...`;

    let parsed = null;
    let providerName = '';

    // Fetch AQI in parallel
    const aqiPromise = fetchAirQuality(lat, lon).catch(() => null);

    // ── Tier 1: Vercel Proxy (OpenWeatherMap) ──
    try {
        const owmData = await fetchFromVercelProxy(lat, lon);
        const aqi = await aqiPromise;
        parsed = parseOpenWeatherResponse(owmData, aqi);
        providerName = 'OpenWeatherMap';
    } catch (tier1Err) {
        console.warn('Tier 1 (Proxy) unavailable, initiating Tier 2 auto-failover:', tier1Err.message);

        // ── Tier 2: Open-Meteo High Resolution ──
        try {
            const meteoData = await fetchFromOpenMeteo(lat, lon);
            const aqi = await aqiPromise;
            parsed = parseOpenMeteoResponse(meteoData, aqi);
            providerName = 'Open-Meteo';
        } catch (tier2Err) {
            console.warn('Tier 2 (Open-Meteo) unavailable, initiating Tier 3 auto-failover:', tier2Err.message);

            // ── Tier 3: wttr.in Global Weather Network ──
            try {
                const wttrData = await fetchFromWttrIn(lat, lon);
                const aqi = await aqiPromise;
                parsed = parseWttrResponse(wttrData, aqi);
                providerName = 'wttr.in';
            } catch (tier3Err) {
                console.error('All weather failover tiers exhausted:', tier3Err.message);
                setViewState('error');
                el.errorMessage.textContent = `Unable to connect to weather data providers for ${geo.name}. Please check internet connection.`;
                return;
            }
        }
    }

    if (parsed) {
        state.activeProvider = providerName;
        state.currentLat = lat;
        state.currentLon = lon;
        state.currentCity = geo.name;
        state.currentCountry = geo.country;
        state.currentCountryCode = geo.countryCode;

        renderWeatherDashboard(parsed, geo);
        updateQuickCityChips(geo.name);
        console.log(`[Aura Weather] Active data source: ${providerName}`);
    }
}

// ── Location Resolution (GPS with IP Fallback) ──
async function detectDeviceLocation() {
    return new Promise(resolve => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 7000, enableHighAccuracy: true }
        );
    });
}

async function detectIpLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
            return {
                lat: data.latitude,
                lon: data.longitude,
                name: data.city,
                country: data.country_name,
                countryCode: data.country_code
            };
        }
    } catch { }
    return null;
}

async function initializeDefaultLocation() {
    state.isCurrentLocation = true;
    setViewState('loading');
    el.loadingMessage.textContent = 'Acquiring satellite or network position...';

    const coords = await detectDeviceLocation();
    let geo;

    if (coords) {
        geo = await reverseGeocodeCoords(coords.lat, coords.lon);
        await loadWeatherData(coords.lat, coords.lon, geo);
    } else {
        const ipGeo = await detectIpLocation();
        if (ipGeo) {
            geo = { name: ipGeo.name, country: ipGeo.country, countryCode: ipGeo.countryCode };
            await loadWeatherData(ipGeo.lat, ipGeo.lon, geo);
        } else {
            // Fallback default: New Delhi
            geo = { name: 'New Delhi', country: 'India', countryCode: 'IN' };
            await loadWeatherData(28.6139, 77.2090, geo);
        }
    }
}

// ── Search & Autocomplete ──
let searchTimer = null;
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

el.searchInput.addEventListener('input', () => {
    const q = el.searchInput.value.trim();
    el.clearBtn.style.display = q ? 'flex' : 'none';
    clearTimeout(searchTimer);

    if (q.length < 2) {
        closeSuggestionsDropdown();
        return;
    }

    searchTimer = setTimeout(async () => {
        const results = await searchGeocoding(q);
        currentSuggestions = results;
        selectedSuggestionIndex = -1;
        renderSuggestionsDropdown(results);
    }, 280);
});

el.clearBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    el.clearBtn.style.display = 'none';
    closeSuggestionsDropdown();
    el.searchInput.focus();
});

function renderSuggestionsDropdown(results) {
    if (!results || !results.length) {
        closeSuggestionsDropdown();
        return;
    }

    el.suggestionsList.innerHTML = results.map((item, idx) => `
        <div class="suggestion-item" data-index="${idx}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1-18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="suggestion-city">${item.name}</span>
            <span class="suggestion-country">${item.country}</span>
        </div>
    `).join('');

    el.suggestionsList.style.display = 'block';

    el.suggestionsList.querySelectorAll('.suggestion-item').forEach(elem => {
        elem.addEventListener('click', () => {
            const index = parseInt(elem.dataset.index, 10);
            selectSuggestion(currentSuggestions[index]);
        });
    });
}

function selectSuggestion(item) {
    if (!item) return;
    state.isCurrentLocation = false;
    el.searchInput.value = item.name;
    el.clearBtn.style.display = 'flex';
    closeSuggestionsDropdown();

    loadWeatherData(item.lat, item.lon, {
        name: item.name,
        country: item.country,
        countryCode: item.countryCode
    });
}

function closeSuggestionsDropdown() {
    el.suggestionsList.style.display = 'none';
    el.suggestionsList.innerHTML = '';
    currentSuggestions = [];
    selectedSuggestionIndex = -1;
}

// Keyboard navigation in search
el.searchInput.addEventListener('keydown', (e) => {
    if (el.suggestionsList.style.display === 'block' && currentSuggestions.length > 0) {
        const items = el.suggestionsList.querySelectorAll('.suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
            highlightSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
            highlightSuggestion(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < currentSuggestions.length) {
                selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
            } else if (currentSuggestions[0]) {
                selectSuggestion(currentSuggestions[0]);
            }
        } else if (e.key === 'Escape') {
            closeSuggestionsDropdown();
        }
    } else if (e.key === 'Enter') {
        const q = el.searchInput.value.trim();
        if (q) {
            searchGeocoding(q).then(results => {
                if (results && results[0]) selectSuggestion(results[0]);
            });
        }
    }
});

function highlightSuggestion(items) {
    items.forEach((it, i) => {
        it.classList.toggle('active', i === selectedSuggestionIndex);
    });
}

document.addEventListener('click', (e) => {
    if (!el.searchContainer.contains(e.target)) {
        closeSuggestionsDropdown();
    }
});

// ── Quick Cities Switcher ──
function updateQuickCityChips(activeCityName) {
    const chips = el.quickCities.querySelectorAll('.city-chip');
    chips.forEach(chip => {
        const city = chip.dataset.city;
        chip.classList.toggle('active', city.toLowerCase() === activeCityName.toLowerCase());
    });
}

el.quickCities.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
        const city = chip.dataset.city;
        el.searchInput.value = city;
        el.clearBtn.style.display = 'flex';
        closeSuggestionsDropdown();

        const results = await searchGeocoding(city);
        if (results && results.length > 0) {
            state.isCurrentLocation = false;
            loadWeatherData(results[0].lat, results[0].lon, results[0]);
        }
    });
});

// ── Hourly Slider Scroll Buttons ──
el.hourlyPrev.addEventListener('click', () => {
    el.hourlyList.scrollBy({ left: -260, behavior: 'smooth' });
});

el.hourlyNext.addEventListener('click', () => {
    el.hourlyList.scrollBy({ left: 260, behavior: 'smooth' });
});

// ── Temperature Unit Toggle ──
el.btnCelsius.addEventListener('click', () => {
    if (state.unit === 'C') return;
    state.unit = 'C';
    el.btnCelsius.classList.add('active');
    el.btnFahrenheit.classList.remove('active');
    if (state.rawData) {
        renderWeatherDashboard(state.rawData.data, state.rawData.geo);
    }
});

el.btnFahrenheit.addEventListener('click', () => {
    if (state.unit === 'F') return;
    state.unit = 'F';
    el.btnFahrenheit.classList.add('active');
    el.btnCelsius.classList.remove('active');
    if (state.rawData) {
        renderWeatherDashboard(state.rawData.data, state.rawData.geo);
    }
});

// ── Top Navigation Action Triggers ──
el.locateMeBtn.addEventListener('click', initializeDefaultLocation);
el.btnCurrentLocation.addEventListener('click', initializeDefaultLocation);

el.btnRefresh.addEventListener('click', () => {
    el.btnRefresh.classList.add('spinning');
    setTimeout(() => el.btnRefresh.classList.remove('spinning'), 800);

    if (state.currentLat && state.currentLon && state.rawData) {
        loadWeatherData(state.currentLat, state.currentLon, state.rawData.geo);
    } else {
        initializeDefaultLocation();
    }
});

el.retryBtn.addEventListener('click', initializeDefaultLocation);

// ── Application Boot Sequence ──
initTheme();
initializeDefaultLocation();

// ── Responsive Viewport Resize Handler ──
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (state.rawData) {
            renderTrendGraph(state.rawData.data.hourly);
        }
    }, 200);
});
