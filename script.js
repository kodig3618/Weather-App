const apiKey = "fe8658516f8d1edaccb4878668b0180a";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const errorDiv = document.querySelector(".error");
const weatherDiv = document.querySelector(".weather");
const loadingDiv = document.querySelector(".loading");
const tempElem = document.querySelector(".temp");
const toggleUnitBtn = document.querySelector(".toggle-unit");

let currentWeatherData = null;
let isCelsius = false;

function showLoading(show) {
    loadingDiv.style.display = show ? "block" : "none";
}

function showError(message = "") {
    errorDiv.textContent = message;
    errorDiv.style.display = message ? "block" : "none";
}

function showWeather(show) {
    weatherDiv.style.display = show ? "block" : "none";
}

function toCelsius(f) {
    return (f - 32) * 5 / 9;
}

function toFahrenheit(c) {
    return (c * 9 / 5) + 32;
}

function updateWeatherUI(data) {
    document.querySelector(".city").textContent = data.name;
    const tempF = data.main.temp;
    const temp = isCelsius ? Math.round(toCelsius(tempF)) : Math.round(tempF);
    tempElem.textContent = `${temp}°${isCelsius ? "C" : "F"}`;
    document.querySelector(".humidity").textContent = `${data.main.humidity}%`;
    document.querySelector(".wind").textContent = `${Math.round(data.wind.speed)} mph`;

    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description || data.weather[0].main;

    toggleUnitBtn.textContent = isCelsius ? "Show °F" : "Show °C";
}

async function checkWeather(city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
        showError("Please enter a city name.");
        showWeather(false);
        return;
    }
    showLoading(true);
    showError();
    showWeather(false);
    try {
        const url = `${apiUrl}?q=${encodeURIComponent(trimmedCity)}&units=imperial&appid=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("City not found.");
        }
        const data = await response.json();
        currentWeatherData = data;
        updateWeatherUI(data);
        showWeather(true);
    } catch (err) {
        showError(err.message || "An error occurred.");
    } finally {
        showLoading(false);
    }
}

searchBtn.addEventListener("click", () => checkWeather(searchBox.value));
searchBox.addEventListener("keydown", e => {
    if (e.key === "Enter") checkWeather(searchBox.value);
});

toggleUnitBtn.addEventListener("click", () => {
    if (!currentWeatherData) return;
    isCelsius = !isCelsius;
    updateWeatherUI(currentWeatherData);
});
function formatTime(unixTimestamp, timezoneOffset) {
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateAdditionalInfo(data) {
    // Feels like
    const feelsLikeF = data.main.feels_like;
    const feelsLike = isCelsius ? Math.round(toCelsius(feelsLikeF)) : Math.round(feelsLikeF);
    let feelsLikeElem = document.querySelector(".feels-like");
    if (!feelsLikeElem) {
        feelsLikeElem = document.createElement("div");
        feelsLikeElem.className = "feels-like";
        tempElem.parentNode.insertBefore(feelsLikeElem, tempElem.nextSibling);
    }
    feelsLikeElem.textContent = `Feels like: ${feelsLike}°${isCelsius ? "C" : "F"}`;

    // Weather description
    let descElem = document.querySelector(".weather-desc");
    if (!descElem) {
        descElem = document.createElement("div");
        descElem.className = "weather-desc";
        weatherIcon.parentNode.insertBefore(descElem, weatherIcon.nextSibling);
    }
    descElem.textContent = data.weather[0].description
        ? data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)
        : "";

    // Sunrise/Sunset
    let sunElem = document.querySelector(".sun-times");
    if (!sunElem) {
        sunElem = document.createElement("div");
        sunElem.className = "sun-times";
        weatherDiv.appendChild(sunElem);
    }
    const tz = data.timezone || 0;
    const sunrise = formatTime(data.sys.sunrise, tz);
    const sunset = formatTime(data.sys.sunset, tz);
    sunElem.textContent = `Sunrise: ${sunrise} | Sunset: ${sunset}`;
}

// Patch updateWeatherUI to call updateAdditionalInfo
const origUpdateWeatherUI = updateWeatherUI;
updateWeatherUI = function(data) {
    origUpdateWeatherUI(data);
    updateAdditionalInfo(data);
};
