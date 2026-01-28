(function () {
  'use strict';

  const els = {
    cityTime: document.getElementById('city-time'),
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    visibility: document.getElementById('visibility'),
    feelslike: document.getElementById('feelslike'),
    forecast: document.getElementById('forecast'),
    conditionsSummary: document.getElementById('conditions-summary'),
    conditionsDetails: document.getElementById('conditions-details'),
    topDate: document.getElementById('top-date'),
    topTime: document.getElementById('top-time')
  };

  const PLACEHOLDER = {
    city: 'WINNIPEG',
    temperature_c: -41,
    wind_direction: 'W',
    wind_speed_kmh: 13,
    humidity: 66,
    visibility_km: 2,
    wind_chill: -54,
    forecast_text: 'FORECAST FOR TODAY..HIGH -29. SUNNY. ICE FOG PATCHES DISSIPATING THIS MORNING.',
    observation_time: new Date().toISOString()
  };

  const GEO_MET_URL = 'https://api.weather.gc.ca/collections/observations/items?f=json&station_id=s0000193';

  async function fetchWeatherData() {
    try {
      const res = await fetch(GEO_MET_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Bad response ' + res.status);
      const json = await res.json();
      // latest observation is first item
      const obs = json.features[0]?.properties;
      if (!obs) throw new Error('No observation data');
      return {
        city: 'WINNIPEG',
        temperature_c: obs.temperature?.value ?? null,
        wind_direction: obs.windDirection?.value ?? null,
        wind_speed_kmh: obs.windSpeed?.value ?? null,
        humidity: obs.humidity?.value ?? null,
        visibility_km: obs.visibility?.value ?? null,
        wind_chill: obs.windChill?.value ?? null,
        forecast_text: obs.textSummary ?? null,
        observation_time: obs.dateTime ?? new Date().toISOString()
      };
    } catch (err) {
      console.error('GeoMet fetch failed', err);
      return null;
    }
  }

  function formatTemp(c) {
    return Number.isFinite(c) ? `${c >= 0 ? '+' : ''}${c} C` : '-- C';
  }

  function formatWind(speed, dir) {
    if (speed == null || !dir) return '--';
    return `${dir} ${speed} KMH`;
  }

  function applyData(data) {
    const d = data || PLACEHOLDER;

    const obsTime = new Date(d.observation_time);
    const hh = obsTime.getHours();
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const minutes = String(obsTime.getMinutes()).padStart(2, '0');

    const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const dateStr = `${dayNames[obsTime.getDay()]} ${obsTime.getDate()} ${monthNames[obsTime.getMonth()]} ${obsTime.getFullYear()}`;

    els.cityTime.textContent = `${d.city} ${hour12} ${ampm} CST ${dateStr}`;

    els.temperature.textContent = formatTemp(d.temperature_c);
    els.humidity.textContent = d.humidity != null ? `${d.humidity} %` : '-- %';
    els.visibility.textContent = d.visibility_km != null ? `${d.visibility_km} KM` : '-- KM';
    els.forecast.textContent = d.forecast_text || '--';

    els.wind.textContent = formatWind(d.wind_speed_kmh, d.wind_direction);
    els.feelslike.textContent = Number.isFinite(d.wind_chill) ? `${d.wind_chill} C` : '--';
    els.conditionsSummary.textContent = d.forecast_text ? d.forecast_text.split('.')[0] : '—';
    els.conditionsDetails.textContent = d.forecast_text ? d.forecast_text.replace(/^.*?\.\s*/, '') : '';
  }

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = dayNames[now.getDay()];
    const dateNum = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    els.topTime.textContent = `${hh}:${mm}:${ss}`;
    els.topDate.textContent = `${day} ${dateNum} ${month} ${year}`;
  }

  function init() {
    updateClock();
    setInterval(updateClock, 1000);

    els.forecast.textContent = 'LOADING WEATHER...';
    fetchWeatherData()
      .then(json => applyData(json))
      .catch(() => applyData(null));

    setInterval(() => {
      fetchWeatherData()
        .then(json => applyData(json))
        .catch(() => {/* ignore */});
    }, 10 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
