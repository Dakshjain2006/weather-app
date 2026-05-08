// ── Data maps ──
const WEATHER_ICONS = {
  0:'☀️', 1:'🌤', 2:'⛅', 3:'☁️',
  45:'🌫', 48:'🌫',
  51:'🌦', 53:'🌦', 55:'🌧',
  61:'🌧', 63:'🌧', 65:'🌧',
  71:'🌨', 73:'🌨', 75:'❄️',
  80:'🌦', 81:'🌦', 82:'⛈',
  95:'⛈', 96:'⛈', 99:'⛈'
};

const CONDITIONS = {
  0:'Clear Sky', 1:'Mainly Clear', 2:'Partly Cloudy', 3:'Overcast',
  45:'Foggy', 48:'Icy Fog',
  51:'Light Drizzle', 53:'Drizzle', 55:'Heavy Drizzle',
  61:'Light Rain', 63:'Moderate Rain', 65:'Heavy Rain',
  71:'Light Snow', 73:'Moderate Snow', 75:'Heavy Snow',
  80:'Rain Showers', 81:'Rain Showers', 82:'Violent Showers',
  95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm'
};

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Theme setter ──
function setTheme(code, hour) {
  document.body.className = '';
  if (hour < 6 || hour >= 20)                          { document.body.classList.add('night');  return; }
  if ([95,96,99].includes(code))                       { document.body.classList.add('stormy'); return; }
  if ([61,63,65,80,81,82,51,53,55].includes(code))    { document.body.classList.add('rainy');  return; }
  if ([71,73,75].includes(code))                       { document.body.classList.add('snowy');  return; }
  if (code === 0 || code === 1)                         { document.body.classList.add('sunny');  return; }
  document.body.classList.add('cloudy');
}

// ── Utility ──
function show(id)  { document.getElementById(id).classList.remove('hidden'); }
function hide(id)  { document.getElementById(id).classList.add('hidden'); }

// ── Main fetch function ──
async function fetchWeather() {
  const city = document.getElementById('city-input').value.trim();
  if (!city) return;

  show('loading');
  hide('error-msg');
  hide('weather-content');

  try {
    // 1. Geocoding
    const geoRes  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');

    const { latitude, longitude, name, country } = geoData.results[0];

    // 2. Weather
    const wUrl = `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&wind_speed_unit=kmh&timezone=auto&forecast_days=5`;

    const wRes  = await fetch(wUrl);
    const w     = await wRes.json();
    const c     = w.current;
    const d     = w.daily;
    const hour  = new Date(c.time).getHours();

    // 3. Populate UI
    document.getElementById('city-display').textContent = `${name}, ${country}`;
    document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    document.getElementById('w-icon').textContent        = WEATHER_ICONS[c.weather_code] || '🌡';
    document.getElementById('temp-display').innerHTML    = `${Math.round(c.temperature_2m)}<sup>°C</sup>`;
    document.getElementById('condition-display').textContent = CONDITIONS[c.weather_code] || 'Unknown';
    document.getElementById('humidity').textContent      = c.relative_humidity_2m + '%';
    document.getElementById('wind').textContent          = Math.round(c.wind_speed_10m) + ' km/h';
    document.getElementById('visibility').textContent    =
      c.visibility >= 1000 ? Math.round(c.visibility / 1000) + ' km' : c.visibility + ' m';
    document.getElementById('feelslike').textContent     = Math.round(c.apparent_temperature) + '°C';

    // 4. Forecast
    let forecastHtml = '';
    for (let i = 0; i < 5; i++) {
      const dayName = i === 0 ? 'Today' : DAYS[new Date(d.time[i]).getDay()];
      forecastHtml += `
        <div class="day-card">
          <div class="day-name">${dayName}</div>
          <div class="day-icon">${WEATHER_ICONS[d.weather_code[i]] || '🌡'}</div>
          <div class="day-temp">${Math.round(d.temperature_2m_max[i])}°</div>
          <div class="day-lo">${Math.round(d.temperature_2m_min[i])}°</div>
        </div>`;
    }
    document.getElementById('forecast-row').innerHTML = forecastHtml;

    setTheme(c.weather_code, hour);
    show('weather-content');
    hide('loading');

  } catch (err) {
    hide('loading');
    const errEl = document.getElementById('error-msg');
    errEl.textContent = '⚠ ' + (err.message || 'Could not fetch weather. Try another city.');
    show('error-msg');
  }
}

// ── Auto-load Delhi on start ──
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('city-input').value = 'Delhi';
  fetchWeather();
});
