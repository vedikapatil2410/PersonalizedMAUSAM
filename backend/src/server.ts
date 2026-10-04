import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { CONFIG } from './config';
import { getLiveIMDWeather } from './services/imdService';
import { getExternalWeatherEnrichment } from './services/externalEnrichmentService';

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Common CORS headers for web and mobile clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check endpoint
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'PersonalizedMAUSAM Backend',
        source: 'India Meteorological Department (IMD)',
        imdPortal: CONFIG.imdBaseUrl,
        enrichment: {
          uvAndVisibility: 'Open-Meteo API',
          pollen: CONFIG.googlePollenApiKey ? 'Google Pollen API (Configured)' : 'Google Pollen API (Key Not Configured)',
        },
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 2. IMD connectivity/status endpoint
  if (pathname === '/api/imd/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'active',
        provider: 'India Meteorological Department',
        defaultCity: CONFIG.defaultCity,
        supportedStations: CONFIG.stationMapping,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 3. Live IMD Weather Data Endpoint with External Enrichment
  if (pathname === '/api/imd/weather' && req.method === 'GET') {
    const city = parsedUrl.searchParams.get('city') || CONFIG.defaultCity;

    try {
      // Fetch IMD weather and external enrichment in parallel with fault-isolation
      const [imdResult, externalResult] = await Promise.allSettled([
        getLiveIMDWeather(city),
        getExternalWeatherEnrichment(city),
      ]);

      if (imdResult.status === 'rejected') {
        throw imdResult.reason;
      }

      const weatherData = imdResult.value;
      const externalData = externalResult.status === 'fulfilled' ? externalResult.value : null;

      // Enrich UV and Visibility if Open-Meteo data is successfully retrieved
      if (externalData?.openMeteo?.available && externalData.openMeteo.data) {
        weatherData.uvIndex = externalData.openMeteo.data.uvIndex;
        weatherData.visibility = externalData.openMeteo.data.visibilityKm;
        weatherData.unavailableFields = weatherData.unavailableFields.filter(
          (field) => field !== 'uvIndex' && field !== 'visibility'
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          city,
          weather: weatherData,
          externalData,
        })
      );
    } catch (error: any) {
      console.error(`[IMD Service Error] Failed to retrieve weather for ${city}:`, error.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          city,
          error: 'Unable to load live IMD weather data.',
          details: error.message,
        })
      );
    }
    return;
  }

  // 4. Standalone External Weather Enrichment Endpoint
  if (pathname === '/api/external/weather' && req.method === 'GET') {
    const city = parsedUrl.searchParams.get('city') || CONFIG.defaultCity;

    try {
      const enrichment = await getExternalWeatherEnrichment(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          city,
          data: enrichment,
        })
      );
    } catch (error: any) {
      console.error(`[Enrichment Error] Failed to retrieve enrichment for ${city}:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          city,
          error: 'Failed to retrieve external weather enrichment.',
          details: error.message,
        })
      );
    }
    return;
  }

  // 5. Standalone Pollen Forecast Endpoint
  if (pathname === '/api/pollen/forecast' && req.method === 'GET') {
    const city = parsedUrl.searchParams.get('city') || CONFIG.defaultCity;

    try {
      const enrichment = await getExternalWeatherEnrichment(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          city,
          pollen: enrichment.pollen,
        })
      );
    } catch (error: any) {
      console.error(`[Pollen Endpoint Error] Failed for ${city}:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          city,
          error: 'Failed to retrieve pollen data.',
          details: error.message,
        })
      );
    }
    return;
  }

  // 6. Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(CONFIG.port, CONFIG.host, () => {
  console.log(`[PersonalizedMAUSAM Backend] Server listening at http://${CONFIG.host}:${CONFIG.port}`);
  console.log(`[PersonalizedMAUSAM Backend] Health check: http://localhost:${CONFIG.port}/health`);
  console.log(`[PersonalizedMAUSAM Backend] IMD Weather: http://localhost:${CONFIG.port}/api/imd/weather?city=Pune`);
  console.log(`[PersonalizedMAUSAM Backend] External Weather: http://localhost:${CONFIG.port}/api/external/weather?city=Pune`);
  console.log(`[PersonalizedMAUSAM Backend] Pollen Forecast: http://localhost:${CONFIG.port}/api/pollen/forecast?city=Pune`);
});

export default server;
