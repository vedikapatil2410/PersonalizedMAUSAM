export const CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  defaultCity: process.env.DEFAULT_CITY || 'Pune',
  imdBaseUrl: process.env.IMD_BASE_URL || 'https://mausam.imd.gov.in',
  imdEndpoint: process.env.IMD_OBSERVATION_ENDPOINT || '/responsive/LIP/sample4State.php',

  // Official IMD station mappings for supported cities
  stationMapping: {
    'Pune': { id: '43063', name: 'Pune-Shivajinagar', state: 'IN-MH' },
    'Mumbai': { id: '43003', name: 'Mumbai-Santacruz', state: 'IN-MH' },
    'Delhi': { id: '42182', name: 'New Delhi-Safdarjung', state: 'IN-DL' },
  } as Record<string, { id: string; name: string; state: string }>,
};
