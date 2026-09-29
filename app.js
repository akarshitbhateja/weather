/* ─────────────────────────────────────────
   AURA WEATHER — app.js
   ───────────────────────────────────────── */

'use strict';

// ── State ────────────────────────────────
const state = {
    unit: 'C',
    isCurrentLocation: false,
    currentLat: null,
    currentLon: null,
    currentCity: null,
};

// ── DOM refs ─────────────────────────────
const $ = (id) => document.getElementById(id);
const el = {
    weatherContent: $('weatherContent'),
    loading: $('loading'),
    loadingMsg: $('loadingMessage'),
    errorState: $('errorState'),
    errorMsg: $('errorMessage'),
    cityName: $('cityName'),
    countryBadge: $('countryBadge'),
    currentLocBadge: $('currentLocBadge'),
    weatherDate: $('weatherDate'),
    weatherDesc: $('weatherDesc'),
    weatherIcon: $('weatherIcon'),
    tempValue: $('tempValue'),
    tempUnit: $('tempUnit'),
    feelsLike: $('feelsLike'),
    tempMax: $('tempMax'),
    tempMin: $('tempMin'),
    humidity: $('humidity'),
    humiditySub: $('humiditySub'),
    windSpeed: $('windSpeed'),
    windSub: $('windSub'),
    uvIndex: $('uvIndex'),
    uvSub: $('uvSub'),
    visibility: $('visibility'),
    visibilitySub: $('visibilitySub'),
    pressure: $('pressure'),
    pressureSub: $('pressureSub'),
    precipitationProb: $('precipitationProb'),
    precipitationSub: $('precipitationSub'),
    sunrise: $('sunrise'),
    sunset: $('sunset'),
    daylightSummary: $('daylightSummary'),
    sunDot: $('sunDot'),
    hourlyList: $('hourlyList'),
    forecastGrid: $('forecastGrid'),
    searchInput: $('searchInput'),
    suggestionsList: $('suggestionsList'),
    clearBtn: $('clearBtn'),
};

// ── Utility ───────────────────────────────
function showState(name) {
    el.loading.style.display = name === 'loading' ? 'flex' : 'none';
    el.errorState.style.display = name === 'error' ? 'flex' : 'none';
    el.weatherContent.style.display = name === 'weather' ? 'block' : 'none';
}

function celsiusToFahrenheit(c) { return Math.round(c * 9 / 5 + 32); }
function displayTemp(c) {
    if (state.unit === 'F') return celsiusToFahrenheit(c) + '°F';
    return Math.round(c) + '°C';
}
function rawTemp(c) { return state.unit === 'F' ? celsiusToFahrenheit(c) : Math.round(c); }

function formatHour(date) {
    const h = date.getHours();
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function dayName(date, full = false) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const short = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return full ? days[date.getDay()] : short[date.getDay()];
}

function formatDate(date) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function weatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function describeHumidity(h) {
    if (h < 30) return 'Dry';
    if (h < 55) return 'Comfortable';
    if (h < 75) return 'Humid';
    return 'Very humid';
}
function describeUV(uv) {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very high';
    return 'Extreme';
}
function describeVisibility(km) {
    if (km >= 10) return 'Clear';
    if (km >= 5) return 'Good';
    if (km >= 2) return 'Moderate';
    return 'Poor';
}
function describePressure(hpa) {
    if (hpa > 1020) return 'High pressure';
    if (hpa < 1000) return 'Low pressure';
    return 'Normal';
}

// ── API: Geocoding ────────────────────────
async function geocodeCity(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).map(r => ({
        name: r.name,
        country: r.country,
        country_code: r.country_code,
        lat: r.latitude,
        lon: r.longitude,
    }));
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const addr = data.address || {};
        return {
            name: addr.city || addr.town || addr.village || addr.county || 'Unknown',
            country: addr.country || '',
            country_code: (addr.country_code || '').toUpperCase(),
        };
    } catch { return { name: 'Your Location', country: '', country_code: '' }; }
}

// ── API: Weather (OWM proxy → Open-Meteo fallback) ──
async function fetchWeatherOWM(lat, lon) {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Proxy unavailable');
    return res.json();
}

async function fetchWeatherMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility` +
        `&hourly=temperature_2m,weather_code,relative_humidity_2m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
        `&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo failed');
    return res.json();
}

// Open-Meteo WMO weather code → OWM-compatible icon
function wmoToIcon(code) {
    if (code === 0) return '01d';
    if ([1, 2].includes(code)) return '02d';
    if (code === 3) return '04d';
    if ([45, 48].includes(code)) return '50d';
    if ([51, 53, 55, 61, 63, 65].includes(code)) return '10d';
    if ([71, 73, 75, 77].includes(code)) return '13d';
    if ([80, 81, 82].includes(code)) return '09d';
    if ([95, 96, 99].includes(code)) return '11d';
    return '03d';
}

function wmoToDesc(code) {
    const map = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle',
        55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
        71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
        80: 'Showers', 81: 'Rain showers', 82: 'Heavy showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm',
    };
    return map[code] || 'Unknown';
}

// ── Render ────────────────────────────────
let _rawData = null;

function renderWeather(data, geoInfo) {
    _rawData = { data, geoInfo };

    // Hero
    el.cityName.textContent = geoInfo.name;
    el.countryBadge.textContent = geoInfo.country_code || geoInfo.country;
    el.currentLocBadge.style.display = state.isCurrentLocation ? 'flex' : 'none';
    el.weatherDate.textContent = formatDate(new Date());
    el.weatherDesc.textContent = data.description;
    el.weatherIcon.src = weatherIconUrl(data.icon);
    el.weatherIcon.alt = data.description;

    // Temp
    el.tempValue.textContent = rawTemp(data.temp);
    el.tempUnit.textContent = state.unit === 'F' ? '°F' : '°C';
    el.feelsLike.textContent = displayTemp(data.feelsLike);
    el.tempMax.textContent = displayTemp(data.tempMax);
    el.tempMin.textContent = displayTemp(data.tempMin);

    // Conditions
    el.humidity.textContent = `${data.humidity}%`;
    el.humiditySub.textContent = describeHumidity(data.humidity);

    const ws = data.windSpeed;
    el.windSpeed.textContent = `${Math.round(ws)} km/h`;
    el.windSub.textContent = ws < 20 ? 'Calm' : ws < 50 ? 'Breezy' : ws < 80 ? 'Windy' : 'Strong wind';

    const uv = data.uvIndex ?? '—';
    el.uvIndex.textContent = uv === '—' ? '—' : uv;
    el.uvSub.textContent = uv === '—' ? '' : describeUV(uv);

    const vis = data.visibility;
    const visKm = Math.round(vis / 100) / 10;
    el.visibility.textContent = `${visKm} km`;
    el.visibilitySub.textContent = describeVisibility(visKm);

    el.pressure.textContent = `${Math.round(data.pressure)} hPa`;
    el.pressureSub.textContent = describePressure(data.pressure);

    const precip = data.precipitationProb ?? '—';
    el.precipitationProb.textContent = precip === '—' ? '—' : `${precip}%`;
    el.precipitationSub.textContent = precip === '—' ? '' : precip < 20 ? 'Unlikely' : precip < 60 ? 'Possible' : 'Likely';

    // Sun
    renderSun(data.sunrise, data.sunset);

    // Hourly
    renderHourly(data.hourly);

    // Forecast
    renderForecast(data.forecast);

    showState('weather');
}

function renderSun(sunriseTs, sunsetTs) {
    const now = new Date();
    const sunrise = new Date(sunriseTs * 1000);
    const sunset = new Date(sunsetTs * 1000);

    const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.sunrise.textContent = fmt(sunrise);
    el.sunset.textContent = fmt(sunset);

    const totalMs = sunset - sunrise;
    const elapsed = now - sunrise;
    const pct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
    el.sunDot.style.left = `${pct}%`;

    const hours = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    el.daylightSummary.textContent = `${hours}h ${mins}m of daylight`;
}

function renderHourly(hourly) {
    if (!hourly || !hourly.length) return;
    const now = Date.now();
    const next24 = hourly.filter(h => h.time * 1000 >= now).slice(0, 24);
    const nowHour = new Date().getHours();

    el.hourlyList.innerHTML = next24.map((h, i) => {
        const d = new Date(h.time * 1000);
        const isNow = i === 0;
        return `<div class="hourly-item${isNow ? ' active-hour' : ''}">
            <span class="hourly-time">${isNow ? 'Now' : formatHour(d)}</span>
            <img src="${weatherIconUrl(h.icon)}" alt="">
            <span class="hourly-temp">${rawTemp(h.temp)}°</span>
        </div>`;
    }).join('');
}

function renderForecast(forecast) {
    if (!forecast || !forecast.length) return;
    const today = new Date().toDateString();
    const allTemps = forecast.map(d => [d.tempMin, d.tempMax]).flat();
    const globalMin = Math.min(...allTemps);
    const globalMax = Math.max(...allTemps);
    const range = globalMax - globalMin || 1;

    el.forecastGrid.innerHTML = forecast.map((d, i) => {
        const date = new Date(d.date * 1000);
        const isToday = date.toDateString() === today;
        const dayLabel = isToday ? 'Today' : dayName(date, true);
        const lo = rawTemp(d.tempMin);
        const hi = rawTemp(d.tempMax);
        const leftPct = ((d.tempMin - globalMin) / range * 80).toFixed(1);
        const widthPct = (((d.tempMax - d.tempMin) / range) * 80 + 20).toFixed(1);

        return `<div class="forecast-row${isToday ? ' today-row' : ''}">
            <span class="fcast-day${isToday ? ' today' : ''}">${dayLabel}</span>
            <img class="fcast-icon" src="${weatherIconUrl(d.icon)}" alt="${d.description}">
            <div class="fcast-bar">
                <span class="fcast-lo">${lo}°</span>
                <div class="fcast-bar-track">
                    <div class="fcast-bar-fill" style="left:${leftPct}%;width:${widthPct}%"></div>
                </div>
                <span class="fcast-hi">${hi}°</span>
            </div>
            <span class="fcast-desc">${d.description}</span>
        </div>`;
    }).join('');
}

// ── Fetch & Parse ─────────────────────────
async function loadWeather(lat, lon, geoInfo) {
    showState('loading');
    el.loadingMsg.textContent = `Loading weather for ${geoInfo.name}…`;

    try {
        // Try OWM proxy
        let parsed;
        try {
            const owm = await fetchWeatherOWM(lat, lon);
            parsed = parseOWM(owm);
        } catch {
            // Fallback: Open-Meteo
            const meteo = await fetchWeatherMeteo(lat, lon);
            parsed = parseMeteo(meteo);
        }
        renderWeather(parsed, geoInfo);
    } catch (e) {
        showState('error');
        el.errorMsg.textContent = 'Could not load weather. Please check your connection.';
    }
}

function parseOWM(d) {
    const current = d.current;
    const forecast = d.forecast;
    // hourly from OWM 3-hour steps
    const hourly = (forecast?.list || []).map(h => ({
        time: h.dt,
        temp: h.main.temp,
        icon: h.weather[0].icon,
    }));

    // Build daily forecast
    const daily = {};
    (forecast?.list || []).forEach(h => {
        const day = new Date(h.dt * 1000).toDateString();
        if (!daily[day]) {
            daily[day] = { date: h.dt, temps: [], icons: [], descs: [] };
        }
        daily[day].temps.push(h.main.temp_min, h.main.temp_max);
        daily[day].icons.push(h.weather[0].icon);
        daily[day].descs.push(h.weather[0].description);
    });
    const forecastDays = Object.values(daily).slice(0, 5).map(d => ({
        date: d.date,
        tempMin: Math.min(...d.temps),
        tempMax: Math.max(...d.temps),
        icon: d.icons[0],
        description: d.descs[0],
    }));

    return {
        temp: current.main.temp,
        feelsLike: current.main.feels_like,
        tempMax: current.main.temp_max,
        tempMin: current.main.temp_min,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed * 3.6,
        pressure: current.main.pressure,
        visibility: current.visibility ?? 10000,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        uvIndex: null,
        precipitationProb: null,
        hourly,
        forecast: forecastDays,
    };
}

function parseMeteo(d) {
    const c = d.current;
    const hourly = (d.hourly?.time || []).map((t, i) => ({
        time: new Date(t).getTime() / 1000,
        temp: d.hourly.temperature_2m[i],
        icon: wmoToIcon(d.hourly.weather_code[i]),
    }));

    const daily = d.daily;
    const forecastDays = (daily?.time || []).slice(0, 5).map((t, i) => ({
        date: new Date(t).getTime() / 1000,
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        icon: wmoToIcon(daily.weather_code[i]),
        description: wmoToDesc(daily.weather_code[i]),
    }));

    const sunrise = daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).getTime() / 1000 : null;
    const sunset = daily?.sunset?.[0] ? new Date(daily.sunset[0]).getTime() / 1000 : null;

    return {
        temp: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        tempMax: daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
        tempMin: daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        pressure: c.surface_pressure,
        visibility: (c.visibility ?? 10) * 1000,
        description: wmoToDesc(c.weather_code),
        icon: wmoToIcon(c.weather_code),
        sunrise,
        sunset,
        uvIndex: daily?.uv_index_max?.[0] ?? null,
        precipitationProb: daily?.precipitation_probability_max?.[0] ?? null,
        hourly,
        forecast: forecastDays,
    };
}

// ── Geolocation ───────────────────────────
async function detectLocation() {
    showState('loading');
    el.loadingMsg.textContent = 'Detecting your location…';

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null); return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 7000 }
        );
    });
}

async function fetchIPLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();
        if (d.latitude) return { lat: d.latitude, lon: d.longitude, city: d.city, country: d.country_name, country_code: d.country_code };
    } catch {}
    return null;
}

async function initCurrentLocation() {
    state.isCurrentLocation = true;
    let pos = await detectLocation();
    let geoInfo;

    if (pos) {
        state.currentLat = pos.lat;
        state.currentLon = pos.lon;
        geoInfo = await reverseGeocode(pos.lat, pos.lon);
    } else {
        const ip = await fetchIPLocation();
        if (ip) {
            state.currentLat = ip.lat;
            state.currentLon = ip.lon;
            geoInfo = { name: ip.city, country: ip.country_name, country_code: ip.country_code };
        } else {
            state.currentLat = 28.6139;
            state.currentLon = 77.2090;
            geoInfo = { name: 'New Delhi', country: 'India', country_code: 'IN' };
        }
    }

    state.currentCity = geoInfo.name;
    await loadWeather(state.currentLat, state.currentLon, geoInfo);
}

// ── Search ────────────────────────────────
let searchTimeout;
el.searchInput.addEventListener('input', () => {
    const q = el.searchInput.value.trim();
    el.clearBtn.style.display = q ? 'flex' : 'none';
    clearTimeout(searchTimeout);
    if (q.length < 2) { closeSuggestions(); return; }
    searchTimeout = setTimeout(() => showSuggestions(q), 300);
});

el.clearBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    el.clearBtn.style.display = 'none';
    closeSuggestions();
    el.searchInput.focus();
});

async function showSuggestions(q) {
    const results = await geocodeCity(q);
    if (!results.length) { closeSuggestions(); return; }

    el.suggestionsList.innerHTML = results.map((r, i) =>
        `<div class="suggestion-item" data-idx="${i}" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}" data-country="${r.country}" data-code="${r.country_code}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${r.name}
            <span class="suggestion-country">${r.country}</span>
        </div>`
    ).join('');
    el.suggestionsList.style.display = 'block';

    el.suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const geoInfo = { name: item.dataset.name, country: item.dataset.country, country_code: item.dataset.code };
            state.isCurrentLocation = false;
            el.searchInput.value = item.dataset.name;
            el.clearBtn.style.display = 'flex';
            closeSuggestions();
            loadWeather(lat, lon, geoInfo);
        });
    });
}

function closeSuggestions() {
    el.suggestionsList.style.display = 'none';
    el.suggestionsList.innerHTML = '';
}

document.addEventListener('click', (e) => {
    if (!document.getElementById('searchBar').contains(e.target)) closeSuggestions();
});

el.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSuggestions();
    if (e.key === 'Enter') {
        const first = el.suggestionsList.querySelector('.suggestion-item');
        if (first) first.click();
    }
});

// Popular chips
document.querySelectorAll('.pop-chip').forEach(btn => {
    btn.addEventListener('click', async () => {
        const city = btn.dataset.city;
        const results = await geocodeCity(city);
        if (results.length) {
            state.isCurrentLocation = false;
            el.searchInput.value = city;
            el.clearBtn.style.display = 'flex';
            loadWeather(results[0].lat, results[0].lon, results[0]);
        }
    });
});

// ── Unit Toggle ───────────────────────────
$('btnCelsius').addEventListener('click', () => {
    if (state.unit === 'C') return;
    state.unit = 'C';
    $('btnCelsius').classList.add('active');
    $('btnFahrenheit').classList.remove('active');
    if (_rawData) renderWeather(_rawData.data, _rawData.geoInfo);
});
$('btnFahrenheit').addEventListener('click', () => {
    if (state.unit === 'F') return;
    state.unit = 'F';
    $('btnFahrenheit').classList.add('active');
    $('btnCelsius').classList.remove('active');
    if (_rawData) renderWeather(_rawData.data, _rawData.geoInfo);
});

// ── Nav buttons ───────────────────────────
$('btnCurrentLocation').addEventListener('click', initCurrentLocation);
$('btnRefresh').addEventListener('click', () => {
    if (state.currentLat && _rawData) {
        loadWeather(state.currentLat, state.currentLon, _rawData.geoInfo);
    } else {
        initCurrentLocation();
    }
});
$('locationBtn').addEventListener('click', initCurrentLocation);
$('retryBtn').addEventListener('click', initCurrentLocation);

// ── Boot ──────────────────────────────────
showState('loading');
initCurrentLocation();
