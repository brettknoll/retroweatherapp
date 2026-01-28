// api/weather.js
// Serverless endpoint: fetches live Winnipeg weather JSON and returns clean JSON

const GEO_MET_JSON = 'https://weather.gc.ca/city/pages/mb-38_metric_e.json';

module.exports = async function (req, res) {
  try {
    const resp = await fetch(GEO_MET_JSON);
    if (!resp.ok) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad upstream response', status: resp.status }));
      return;
    }

    const json = await resp.json();

    // Latest observation is the first item
    const latestObs = json?.weather?.[0];
    if (!latestObs) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No observation data found' }));
      return;
    }

    const result = {
      city: 'WINNIPEG',
      temperature_c: latestObs.temperature?.value?.en ?? null,
      wind_direction: latestObs.wind?.direction?.value?.en ?? null,
      wind_speed_kmh: latestObs.wind?.speed?.value?.en ?? null,
      humidity: latestObs.lop?.value?.en ?? null, // LOP is probability of precipitation
      visibility_km: latestObs.visibility?.value?.en ?? null,
      wind_chill: latestObs.windChill?.value?.en ?? null,
      forecast_text: latestObs.condition?.en ?? null,
      observation_time: latestObs.timestamp ?? new Date().toISOString()
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));

  } catch (err) {
    console.error('API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};
