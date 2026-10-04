export const CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  defaultCity: process.env.DEFAULT_CITY || 'Pune',
  imdBaseUrl: process.env.IMD_BASE_URL || 'https://mausam.imd.gov.in',
  imdEndpoint: process.env.IMD_OBSERVATION_ENDPOINT || '/responsive/LIP/sample4State.php',
  googlePollenApiKey: process.env.GOOGLE_POLLEN_API_KEY || '',

  // Official IMD station mappings and coordinates for supported cities
  stationMapping: {
    'Pune': { id: '43063', name: 'Pune-Shivajinagar', state: 'IN-MH', lat: 18.5308, lon: 73.8475 },
    'Mumbai': { id: '43003', name: 'Mumbai-Santacruz', state: 'IN-MH', lat: 19.0886, lon: 72.8679 },
    'Delhi': { id: '42182', name: 'New Delhi-Safdarjung', state: 'IN-DL', lat: 28.5833, lon: 77.2000 },
  } as Record<string, { id: string; name: string; state: string; lat: number; lon: number }>,
};

export function resolveCityStation(city: string): { id: string; name: string; state: string; lat: number; lon: number; cityName: string } {
  const normalized = (city || CONFIG.defaultCity).trim().toLowerCase();
  for (const [key, station] of Object.entries(CONFIG.stationMapping)) {
    if (key.toLowerCase() === normalized || station.name.toLowerCase().includes(normalized)) {
      return { ...station, cityName: key };
    }
  }
  // Default fallback to Pune
  return { ...CONFIG.stationMapping['Pune'], cityName: 'Pune' };
}
