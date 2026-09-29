// ==========================================================================
// Aura Weather — Application Engine
// ==========================================================================

(function () {
    "use strict";

    // --- DOM Elements ---
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearBtn");
    const locationBtn = document.getElementById("locationBtn");
    const btnCurrentLocation = document.getElementById("btnCurrentLocation");
    const btnRefresh = document.getElementById("btnRefresh");
    const suggestionsList = document.getElementById("suggestionsList");
    const quickChips = document.getElementById("quickChips");

    const unitToggle = document.getElementById("unitToggle");
    const btnCelsius = document.getElementById("btnCelsius");
    const btnFahrenheit = document.getElementById("btnFahrenheit");

    const loadingEl = document.getElementById("loading");
    const loadingMessage = document.getElementById("loadingMessage");
    const errorStateEl = document.getElementById("errorState");
    const errorMessageEl = document.getElementById("errorMessage");
    const retryBtn = document.getElementById("retryBtn");

    const weatherContentEl = document.getElementById("weatherContent");
    const cityNameEl = document.getElementById("cityName");
    const countryBadgeEl = document.getElementById("countryBadge");
    const currentLocBadge = document.getElementById("currentLocBadge");
    const weatherDateEl = document.getElementById("weatherDate");
    const weatherDescEl = document.getElementById("weatherDesc");
    const weatherIconLargeEl = document.getElementById("weatherIconLarge");

    const tempValueEl = document.getElementById("tempValue");
    const tempUnitEl = document.getElementById("tempUnit");
    const feelsLikeEl = document.getElementById("feelsLike");
    const tempMaxEl = document.getElementById("tempMax");
    const tempMinEl = document.getElementById("tempMin");

    const hourlyListEl = document.getElementById("hourlyList");

    const humidityEl = document.getElementById("humidity");
    const humiditySubEl = document.getElementById("humiditySub");
    const windSpeedEl = document.getElementById("windSpeed");
    const windSubEl = document.getElementById("windSub");
    const uvIndexEl = document.getElementById("uvIndex");
    const uvSubEl = document.getElementById("uvSub");
    const visibilityEl = document.getElementById("visibility");
    const visibilitySubEl = document.getElementById("visibilitySub");
    const pressureEl = document.getElementById("pressure");
    const pressureSubEl = document.getElementById("pressureSub");
    const precipitationProbEl = document.getElementById("precipitationProb");
    const precipitationSubEl = document.getElementById("precipitationSub");

    const sunriseEl = document.getElementById("sunrise");
    const sunsetEl = document.getElementById("sunset");
    const sunDot = document.getElementById("sunDot");
    const daylightSummary = document.getElementById("daylightSummary");
    const forecastGridEl = document.getElementById("forecastGrid");

    const orbPrimary = document.getElementById("orbPrimary");
    const orbSecondary = document.getElementById("orbSecondary");

    // --- State ---
    let currentUnit = localStorage.getItem("weather_unit") || "metric"; // "metric" or "imperial"
    let currentCoords = null; // { lat, lon, isCurrentLocation: boolean }
    let lastQuery = "";
    let isViewingCurrentLocation = false;
    let searchDebounceTimer = null;

    // --- Helpers ---

    function getUnitSymbol() {
        return currentUnit === "metric" ? "°C" : "°F";
    }

    function getSpeedUnit() {
        return currentUnit === "metric" ? "km/h" : "mph";
    }

    function formatTime(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "--:--";
        let hours = dateObj.getHours();
        const minutes = dateObj.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    function formatHourLabel(isoString, isFirst) {
        if (isFirst) return "Now";
        const d = new Date(isoString);
        let h = d.getHours();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h} ${ampm}`;
    }

    function formatDate(dateObj) {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        }).format(dateObj);
    }

    function getDayLabel(dateStr) {
        const target = new Date(dateStr + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(target);
    }

    function wmoToWeather(code, isNight) {
        const c = Number(code);
        const suffix = isNight ? "n" : "d";
        switch (c) {
            case 0: return { desc: isNight ? "Clear Night" : "Clear Sky", icon: `01${suffix}` };
            case 1: return { desc: "Mainly Clear", icon: `02${suffix}` };
            case 2: return { desc: "Partly Cloudy", icon: `03${suffix}` };
            case 3: return { desc: "Overcast", icon: `04${suffix}` };
            case 45: case 48: return { desc: "Fog", icon: `50${suffix}` };
            case 51: case 53: case 55: return { desc: "Drizzle", icon: `09${suffix}` };
            case 61: case 63: case 65: return { desc: "Rain", icon: `10${suffix}` };
            case 66: case 67: return { desc: "Freezing Rain", icon: `13${suffix}` };
            case 71: case 73: case 75: return { desc: "Snowfall", icon: `13${suffix}` };
            case 77: return { desc: "Snow Grains", icon: `13${suffix}` };
            case 80: case 81: case 82: return { desc: "Rain Showers", icon: `09${suffix}` };
            case 85: case 86: return { desc: "Snow Showers", icon: `13${suffix}` };
            case 95: return { desc: "Thunderstorm", icon: `11${suffix}` };
            case 96: case 99: return { desc: "Thunderstorm with Hail", icon: `11${suffix}` };
            default: return { desc: "Clear", icon: `01${suffix}` };
        }
    }

    function getIconUrl(code) {
        return `https://openweathermap.org/img/wn/${code}@2x.png`;
    }

    function showState(state) {
        loadingEl.style.display = state === "loading" ? "flex" : "none";
        errorStateEl.style.display = state === "error" ? "flex" : "none";
        weatherContentEl.classList.toggle("show", state === "weather");
    }

    // --- Atmospheric Theme Styling ---
    function updateAtmosphereTheme(conditionCode, isNight) {
        if (!orbPrimary || !orbSecondary) return;
        if (isNight) {
            orbPrimary.style.background = "radial-gradient(circle, #312e81, #1e1b4b)";
            orbSecondary.style.background = "radial-gradient(circle, #4c1d95, #1e293b)";
            return;
        }

        const code = Number(conditionCode);
        if (code === 0 || code === 1) {
            // Sunny / Clear
            orbPrimary.style.background = "radial-gradient(circle, #38bdf8, #f59e0b)";
            orbSecondary.style.background = "radial-gradient(circle, #6366f1, #0284c7)";
        } else if (code >= 51 && code <= 82) {
            // Rain / Showers
            orbPrimary.style.background = "radial-gradient(circle, #0284c7, #334155)";
            orbSecondary.style.background = "radial-gradient(circle, #475569, #1e293b)";
        } else if (code >= 95) {
            // Thunder
            orbPrimary.style.background = "radial-gradient(circle, #7c3aed, #1e1b4b)";
            orbSecondary.style.background = "radial-gradient(circle, #0369a1, #3b82f6)";
        } else {
            // Clouds / Default
            orbPrimary.style.background = "radial-gradient(circle, #38bdf8, #6366f1)";
            orbSecondary.style.background = "radial-gradient(circle, #6366f1, #a855f7)";
        }
    }

    // --- Weather Data Retrieval ---

    /**
     * Primary High-Precision Engine (Open-Meteo) with Full Hourly & Daily Coverage
     */
    async function fetchWeatherEngine(lat, lon, cityNameFallback) {
        const tempParam = currentUnit === "imperial" ? "&temperature_unit=fahrenheit" : "";
        const windParam = currentUnit === "imperial" ? "&wind_speed_unit=mph" : "";
        const url = `${CONFIG.OPEN_METEO_WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,visibility,is_day&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7${tempParam}${windParam}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather service is temporarily unavailable.");
        const data = await res.json();

        // Reverse-geocode city name if not already provided
        let resolvedCity = cityNameFallback;
        let resolvedCountry = "";

        if (!resolvedCity) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    resolvedCity = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || "Local Area";
                    resolvedCountry = (geoData.address.country_code || "").toUpperCase();
                }
            } catch (e) {
                resolvedCity = "Current Location";
            }
        }

        return parseEngineResponse(data, resolvedCity, resolvedCountry);
    }

    function parseEngineResponse(data, city, country) {
        const cur = data.current;
        const hourly = data.hourly;
        const daily = data.daily;
        const isNight = cur.is_day === 0;

        const currentCond = wmoToWeather(cur.weather_code, isNight);

        // Process next 24 hours
        const hourlyList = [];
        if (hourly && hourly.time) {
            const now = new Date();
            let count = 0;
            for (let i = 0; i < hourly.time.length && count < 24; i++) {
                const hTime = new Date(hourly.time[i]);
                if (hTime >= now || count > 0) {
                    const hIsNight = hourly.is_day ? hourly.is_day[i] === 0 : false;
                    const hCond = wmoToWeather(hourly.weather_code[i], hIsNight);
                    hourlyList.push({
                        timeLabel: formatHourLabel(hourly.time[i], count === 0),
                        temp: Math.round(hourly.temperature_2m[i]),
                        iconUrl: getIconUrl(hCond.icon),
                        pop: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
                        isCurrent: count === 0,
                    });
                    count++;
                }
            }
        }

        // Process 5-day daily forecast
        const dailyList = [];
        let weekMin = Infinity;
        let weekMax = -Infinity;

        if (daily && daily.time) {
            for (let i = 0; i < Math.min(daily.time.length, 6); i++) {
                const min = Math.round(daily.temperature_2m_min[i]);
                const max = Math.round(daily.temperature_2m_max[i]);
                if (min < weekMin) weekMin = min;
                if (max > weekMax) weekMax = max;
                const dCond = wmoToWeather(daily.weather_code[i], false);
                dailyList.push({
                    day: getDayLabel(daily.time[i]),
                    desc: dCond.desc,
                    iconUrl: getIconUrl(dCond.icon),
                    min: min,
                    max: max,
                });
            }
        }

        const sunriseDate = daily && daily.sunrise && daily.sunrise[0] ? new Date(daily.sunrise[0]) : null;
        const sunsetDate = daily && daily.sunset && daily.sunset[0] ? new Date(daily.sunset[0]) : null;

        const uvVal = daily && daily.uv_index_max && daily.uv_index_max[0] ? Number(daily.uv_index_max[0]).toFixed(1) : "3.0";
        const visKm = cur.visibility ? (cur.visibility / 1000).toFixed(0) : "10";
        const visDisplay = currentUnit === "metric" ? `${visKm} km` : `${(Number(visKm) * 0.621371).toFixed(0)} mi`;

        return {
            city: city || "Current Location",
            country: country || "",
            temp: Math.round(cur.temperature_2m),
            feelsLike: Math.round(cur.apparent_temperature),
            tempMax: dailyList.length > 0 ? dailyList[0].max : Math.round(cur.temperature_2m + 2),
            tempMin: dailyList.length > 0 ? dailyList[0].min : Math.round(cur.temperature_2m - 2),
            humidity: cur.relative_humidity_2m,
            windSpeed: `${Math.round(cur.wind_speed_10m)} ${getSpeedUnit()}`,
            rawWindSpeed: Math.round(cur.wind_speed_10m),
            uvIndex: uvVal,
            visibility: visDisplay,
            pressure: `${Math.round(cur.surface_pressure)} hPa`,
            precipitationProb: hourlyList.length > 0 ? `${hourlyList[0].pop}%` : "0%",
            condition: currentCond.desc,
            conditionCode: cur.weather_code,
            isNight: isNight,
            iconUrl: getIconUrl(currentCond.icon),
            sunriseStr: formatTime(sunriseDate),
            sunsetStr: formatTime(sunsetDate),
            sunriseTimestamp: sunriseDate ? sunriseDate.getTime() : 0,
            sunsetTimestamp: sunsetDate ? sunsetDate.getTime() : 0,
            hourly: hourlyList,
            daily: dailyList.slice(1, 6), // 5 days ahead
            weekMin: weekMin,
            weekMax: weekMax,
        };
    }

    // --- Sub-metric Descriptive Text Helpers ---

    function getHumidityStatus(h) {
        if (h < 30) return "Dry air";
        if (h <= 60) return "Comfortable";
        if (h <= 75) return "Humid";
        return "Very humid";
    }

    function getWindStatus(speedKm) {
        if (speedKm < 5) return "Calm";
        if (speedKm < 15) return "Light breeze";
        if (speedKm < 25) return "Moderate breeze";
        if (speedKm < 40) return "Fresh wind";
        return "High wind";
    }

    function getUVStatus(val) {
        const u = parseFloat(val);
        if (u <= 2) return "Low risk";
        if (u <= 5) return "Moderate";
        if (u <= 7) return "High — use SPF";
        if (u <= 10) return "Very High";
        return "Extreme";
    }

    function getVisibilityStatus(visDisplay) {
        const n = parseFloat(visDisplay);
        if (n >= 10) return "Clear view";
        if (n >= 5) return "Moderate view";
        return "Hazy / Foggy";
    }

    function getPressureStatus(hPa) {
        const p = parseFloat(hPa);
        if (p < 1005) return "Low pressure";
        if (p > 1020) return "High pressure";
        return "Normal";
    }

    function getPrecipitationStatus(popStr) {
        const p = parseInt(popStr);
        if (p === 0) return "No rain expected";
        if (p <= 30) return "Low chance";
        if (p <= 60) return "Possible showers";
        return "Rain likely";
    }

    // --- Render View ---

    function renderWeather(data) {
        cityNameEl.textContent = data.city;
        countryBadgeEl.textContent = data.country || "--";
        currentLocBadge.style.display = isViewingCurrentLocation ? "inline-flex" : "none";
        btnCurrentLocation.classList.toggle("active", isViewingCurrentLocation);

        weatherDateEl.textContent = formatDate(new Date());
        weatherDescEl.textContent = data.condition;
        weatherIconLargeEl.src = data.iconUrl;

        tempValueEl.textContent = data.temp;
        tempUnitEl.textContent = getUnitSymbol();
        feelsLikeEl.textContent = `${data.feelsLike}°`;
        tempMaxEl.textContent = `${data.tempMax}°`;
        tempMinEl.textContent = `${data.tempMin}°`;

        // 6 Environmental Metrics
        humidityEl.textContent = `${data.humidity}%`;
        humiditySubEl.textContent = getHumidityStatus(data.humidity);

        windSpeedEl.textContent = data.windSpeed;
        windSubEl.textContent = getWindStatus(data.rawWindSpeed);

        uvIndexEl.textContent = data.uvIndex;
        uvSubEl.textContent = getUVStatus(data.uvIndex);

        visibilityEl.textContent = data.visibility;
        visibilitySubEl.textContent = getVisibilityStatus(data.visibility);

        pressureEl.textContent = data.pressure;
        pressureSubEl.textContent = getPressureStatus(data.pressure);

        precipitationProbEl.textContent = data.precipitationProb;
        precipitationSubEl.textContent = getPrecipitationStatus(data.precipitationProb);

        // Sun tracker
        sunriseEl.textContent = data.sunriseStr;
        sunsetEl.textContent = data.sunsetStr;

        if (data.sunriseTimestamp && data.sunsetTimestamp) {
            const now = Date.now();
            const total = data.sunsetTimestamp - data.sunriseTimestamp;
            const elapsed = now - data.sunriseTimestamp;
            let percent = (elapsed / total) * 100;
            percent = Math.max(5, Math.min(95, percent));
            sunDot.style.left = `${percent}%`;

            if (now < data.sunriseTimestamp) {
                const diffMin = Math.round((data.sunriseTimestamp - now) / (1000 * 60));
                daylightSummary.textContent = `Sunrise in ${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
            } else if (now < data.sunsetTimestamp) {
                const diffMin = Math.round((data.sunsetTimestamp - now) / (1000 * 60));
                daylightSummary.textContent = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m of daylight remaining`;
            } else {
                daylightSummary.textContent = "Nighttime — Sun has set";
            }
        }

        // Render Hourly Forecast
        hourlyListEl.innerHTML = "";
        data.hourly.forEach((hour) => {
            const card = document.createElement("div");
            card.className = `hourly-card ${hour.isCurrent ? "active-hour" : ""}`;
            const popHtml = hour.pop > 10 ? `<span class="hourly-pop">💧 ${hour.pop}%</span>` : "";
            card.innerHTML = `
                <span class="hourly-time">${hour.timeLabel}</span>
                <div class="hourly-icon">
                    <img src="${hour.iconUrl}" alt="Hour condition">
                </div>
                <span class="hourly-temp">${hour.temp}°</span>
                ${popHtml}
            `;
            hourlyListEl.appendChild(card);
        });

        // Render 5-Day Forecast with visual range bars
        forecastGridEl.innerHTML = "";
        const span = Math.max(1, data.weekMax - data.weekMin);

        data.daily.forEach((dayItem) => {
            const row = document.createElement("div");
            row.className = "daily-row";

            // Relative percentage positioning of range bar
            const leftPercent = Math.max(0, ((dayItem.min - data.weekMin) / span) * 100);
            const widthPercent = Math.max(10, ((dayItem.max - dayItem.min) / span) * 100);

            row.innerHTML = `
                <span class="daily-day">${dayItem.day}</span>
                <div class="daily-icon-box">
                    <img src="${dayItem.iconUrl}" alt="${dayItem.desc}">
                </div>
                <span class="daily-desc">${dayItem.desc}</span>
                <div class="daily-range-bar">
                    <span class="temp-min-text">${dayItem.min}°</span>
                    <div class="temp-bar-track">
                        <div class="temp-bar-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
                    </div>
                    <span class="temp-max-text">${dayItem.max}°</span>
                </div>
            `;
            forecastGridEl.appendChild(row);
        });

        // Update atmospheric theme
        updateAtmosphereTheme(data.conditionCode, data.isNight);

        showState("weather");
    }

    // --- Weather Load Controllers ---

    async function loadWeatherByCoords(lat, lon, cityName, isUserCurrentLocation) {
        showState("loading");
        loadingMessage.textContent = isUserCurrentLocation ? "Retrieving local forecast..." : "Fetching weather...";
        isViewingCurrentLocation = !!isUserCurrentLocation;
        currentCoords = { lat, lon };

        try {
            const data = await fetchWeatherEngine(lat, lon, cityName);
            renderWeather(data);
        } catch (err) {
            console.error("Error loading weather by coords:", err);
            errorMessageEl.textContent = err.message || "Failed to load weather data.";
            showState("error");
        }
    }

    async function loadWeatherByCityName(cityName) {
        showState("loading");
        loadingMessage.textContent = `Searching ${cityName}...`;
        isViewingCurrentLocation = false;
        lastQuery = cityName;

        try {
            const geoRes = await fetch(`${CONFIG.OPEN_METEO_GEO_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
            if (!geoRes.ok) throw new Error("Search service error.");
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`City "${cityName}" not found. Please check spelling.`);
            }

            const match = geoData.results[0];
            const data = await fetchWeatherEngine(match.latitude, match.longitude, match.name);
            data.country = match.country_code || match.country || data.country;
            currentCoords = { lat: match.latitude, lon: match.longitude };
            renderWeather(data);
        } catch (err) {
            console.error("Error loading weather by city:", err);
            errorMessageEl.textContent = err.message || "City not found.";
            showState("error");
        }
    }

    // --- Automatic Default: Detect Current Location Immediately ---

    async function detectCurrentLocationAndLoad() {
        showState("loading");
        loadingMessage.textContent = "Detecting your current location...";

        // Step 1: Immediately initiate GPS via browser
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude, null, true);
                },
                async (geoErr) => {
                    console.warn("GPS permission pending/denied, falling back to instant IP geolocation:", geoErr.message);
                    await fallbackToIPLocation();
                },
                { timeout: 7000, enableHighAccuracy: true }
            );
        } else {
            await fallbackToIPLocation();
        }
    }

    async function fallbackToIPLocation() {
        try {
            const ipRes = await fetch(CONFIG.IP_GEO_URL);
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData.latitude && ipData.longitude) {
                    loadWeatherByCoords(ipData.latitude, ipData.longitude, ipData.city, true);
                    return;
                }
            }
        } catch (e) {
            // Second IP fallback
            try {
                const altRes = await fetch(CONFIG.IP_GEO_FALLBACK_URL);
                if (altRes.ok) {
                    const altData = await altRes.json();
                    if (altData.latitude && altData.longitude) {
                        loadWeatherByCoords(altData.latitude, altData.longitude, altData.city, true);
                        return;
                    }
                }
            } catch (err) {
                console.warn("IP Geolocation failed, using default:", err);
            }
        }

        // Ultimate graceful fallback if completely offline or blocked
        loadWeatherByCityName("London");
    }

    // --- Autocomplete Suggestions ---

    async function fetchCitySuggestions(query) {
        if (!query || query.trim().length < 2) {
            suggestionsList.classList.remove("show");
            return;
        }

        try {
            const res = await fetch(`${CONFIG.OPEN_METEO_GEO_URL}?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`);
            if (!res.ok) return;
            const data = await res.json();
            if (!data.results || data.results.length === 0) {
                suggestionsList.classList.remove("show");
                return;
            }

            suggestionsList.innerHTML = "";
            data.results.forEach((city) => {
                const row = document.createElement("div");
                row.className = "suggestion-row";
                const admin = city.admin1 ? `${city.admin1}, ` : "";
                row.innerHTML = `
                    <span class="sugg-city">${city.name}</span>
                    <span class="sugg-country">${admin}${city.country || ""}</span>
                `;
                row.addEventListener("click", () => {
                    searchInput.value = city.name;
                    clearBtn.style.display = "flex";
                    suggestionsList.classList.remove("show");
                    loadWeatherByCoords(city.latitude, city.longitude, city.name, false);
                });
                suggestionsList.appendChild(row);
            });
            suggestionsList.classList.add("show");
        } catch (e) {
            suggestionsList.classList.remove("show");
        }
    }

    // --- Event Listeners ---

    // Search Input
    searchInput.addEventListener("input", (e) => {
        const val = e.target.value;
        clearBtn.style.display = val.length > 0 ? "flex" : "none";
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            fetchCitySuggestions(val);
        }, 280);
    });

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = searchInput.value.trim();
            if (q) {
                suggestionsList.classList.remove("show");
                loadWeatherByCityName(q);
            }
        }
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.style.display = "none";
        suggestionsList.classList.remove("show");
        searchInput.focus();
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-section")) {
            suggestionsList.classList.remove("show");
        }
    });

    // Popular Quick Chips
    quickChips.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (chip && chip.dataset.city) {
            searchInput.value = chip.dataset.city;
            clearBtn.style.display = "flex";
            loadWeatherByCityName(chip.dataset.city);
        }
    });

    // "My Location" Buttons (both header shortcut and search bar icon)
    function handleLocateMe() {
        detectCurrentLocationAndLoad();
    }

    btnCurrentLocation.addEventListener("click", handleLocateMe);
    locationBtn.addEventListener("click", handleLocateMe);

    // Refresh Button
    btnRefresh.addEventListener("click", () => {
        if (currentCoords) {
            loadWeatherByCoords(currentCoords.lat, currentCoords.lon, isViewingCurrentLocation ? null : cityNameEl.textContent, isViewingCurrentLocation);
        } else {
            detectCurrentLocationAndLoad();
        }
    });

    // Retry Button
    retryBtn.addEventListener("click", () => {
        detectCurrentLocationAndLoad();
    });

    // Unit Toggle
    btnCelsius.addEventListener("click", () => {
        if (currentUnit === "metric") return;
        currentUnit = "metric";
        localStorage.setItem("weather_unit", "metric");
        btnCelsius.classList.add("active");
        btnFahrenheit.classList.remove("active");
        if (currentCoords) {
            loadWeatherByCoords(currentCoords.lat, currentCoords.lon, isViewingCurrentLocation ? null : cityNameEl.textContent, isViewingCurrentLocation);
        }
    });

    btnFahrenheit.addEventListener("click", () => {
        if (currentUnit === "imperial") return;
        currentUnit = "imperial";
        localStorage.setItem("weather_unit", "imperial");
        btnFahrenheit.classList.add("active");
        btnCelsius.classList.remove("active");
        if (currentCoords) {
            loadWeatherByCoords(currentCoords.lat, currentCoords.lon, isViewingCurrentLocation ? null : cityNameEl.textContent, isViewingCurrentLocation);
        }
    });

    // --- App Entry Point ---
    function init() {
        // Set unit toggle initial state
        if (currentUnit === "imperial") {
            btnFahrenheit.classList.add("active");
            btnCelsius.classList.remove("active");
        } else {
            btnCelsius.classList.add("active");
            btnFahrenheit.classList.remove("active");
        }

        // Automatic default location: Current location
        detectCurrentLocationAndLoad();
    }

    init();
})();
