import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { CONFIG } from './config';
import { getLiveIMDWeather } from './services/imdService';

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

  // 1. Health check endpoint (Requirement 10)
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'PersonalizedMAUSAM Backend',
        source: 'India Meteorological Department (IMD)',
        imdPortal: CONFIG.imdBaseUrl,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 2. IMD connectivity/status endpoint (Requirement 10)
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

  // 3. Live IMD Weather Data Endpoint
  if (pathname === '/api/imd/weather' && req.method === 'GET') {
    const city = parsedUrl.searchParams.get('city') || CONFIG.defaultCity;

    try {
      const weatherData = await getLiveIMDWeather(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          city,
          weather: weatherData,
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

  // 4. Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(CONFIG.port, CONFIG.host, () => {
  console.log(`[PersonalizedMAUSAM Backend] Server listening at http://${CONFIG.host}:${CONFIG.port}`);
  console.log(`[PersonalizedMAUSAM Backend] Health check: http://localhost:${CONFIG.port}/health`);
  console.log(`[PersonalizedMAUSAM Backend] IMD Weather: http://localhost:${CONFIG.port}/api/imd/weather?city=Pune`);
});

export default server;
