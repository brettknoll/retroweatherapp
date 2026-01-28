// api/weather.js
// Serverless endpoint: fetches Environment Canada citypage XML and returns clean JSON

const XML_SOURCE = 'https://dd.weather.gc.ca/citypage_weather/xml/MB/s0000450_e.xml';

module.exports = async function (req, res) {
  try {
    // Fetch XML from Environment Canada
    const resp = await fetch(XML_SOURCE);
    if (!resp.ok) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad upstream response', status: resp.status }));
      return;
    }

    let xml = await resp.text();

    // Remove CDATA wrappers
    xml = xml.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');

    // Helper to grab first matching tag content
    const grab = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = xml.match(re);
      return m ? m[1].trim() : null;
    };

    const firstOf = (tags) => {
      for (const t of tags) {
        const val = grab(t);
        if (val !== null) return val;
      }
      return null;
    };

    // Extract data fields
    const city = firstOf(['location', 'location_name', 'location-name', 'name']) || 'UNKNOWN';

    const temperature_c = Number((firstOf(['temperature', 'temperature_c', 'temp_c', 'temp']) || '').match(/-?\d+/)?.[0] ?? null);
    const wind_direction = firstOf(['wind_direction', 'wind_dir', 'windDirection', 'wind']);
    const wind_speed_kmh = Number((firstOf(['wind_speed_kph', 'wind_speed_kmh', 'wind_kph', 'wind_speed']) || '').match(/\d+/)?.[0] ?? null);
    const humidity = Number((firstOf(['relativeHumidity', 'humidity', 'relative_humidity']) || '').match(/\d+/)?.[0] ?? null);
    const visibility_km = Number((firstOf(['visibility_km', 'visibility']) || '').match(/\d+/)?.[0] ?? null);
    const wind_chill = Number((firstOf(['windchill_c', 'wind_chill', 'windchill']) || '').match(/-?\d+/)?.[0] ?? null);

    const forecast_text = (grab('text_summary') || grab('text') || '').replace(/\s+/g, ' ').trim();

    const observation_time = firstOf(['observation_time', 'observation_time_rfc822', 'obsTime', 'time', 'validtime']);

    // Build final JSON
    const result = {
      city: city.toUpperCase(),
      temperature_c: Number.isFinite(temperature_c) ? temperature_c : null,
      wind_direction: wind_direction?.toUpperCase() ?? null,
      wind_speed_kmh: Number.isFinite(wind_speed_kmh) ? wind_speed_kmh : null,
      humidity: Number.isFinite(humidity) ? humidity : null,
      visibility_km: Number.isFinite(visibility_km) ? visibility_km : null,
      wind_chill: Number.isFinite(wind_chill) ? wind_chill : null,
      forecast_text: forecast_text || null,
      observation_time: observation_time || new Date().toISOString()
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
