import { CONFIG, resolveCityStation } from '../config';

export interface OpenMeteoData {
  uvIndex: number;
  visibilityKm: number;
  rawVisibilityMeters: number;
  timestamp: string;
  source: 'Open-Meteo API';
}

export interface PollenTypeDetail {
  code: string;
  displayName: string;
  inSeason: boolean;
  indexValue: number;
  category: string;
}

export interface GooglePollenData {
  available: boolean;
  reason?: string;
  indexValue: number; // 0-5 index
  category: string; // e.g. "Low", "Moderate", "High", "Very High"
  dominantPollenType: string;
  types: PollenTypeDetail[];
  timestamp: string;
  source: 'Google Pollen API';
}

export interface ExternalWeatherData {
  openMeteo: {
    available: boolean;
    data: OpenMeteoData | null;
    error?: string;
  };
  pollen: {
    available: boolean;
    data: GooglePollenData | null;
    error?: string;
  };
  enrichedAt: string;
}

/**
 * Fetches real-time UV Index and Visibility from Open-Meteo API for given coordinates.
 */
export async function fetchOpenMeteoEnrichment(lat: number, lon: number): Promise<OpenMeteoData | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index,visibility&timezone=auto`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PersonalizedMAUSAM-Backend/1.0',
      },
      signal: AbortSignal.timeout(6000), // 6-second timeout
    });

    if (!response.ok) {
      console.warn(`[Open-Meteo] HTTP ${response.status} when fetching UV/Visibility for lat=${lat}, lon=${lon}`);
      return null;
    }

    const json: any = await response.json();
    if (!json?.current) {
      console.warn('[Open-Meteo] Response missing current weather object');
      return null;
    }

    const uvRaw = json.current.uv_index;
    const visibilityMeters = json.current.visibility;

    const uvIndex = typeof uvRaw === 'number' ? Math.round(uvRaw * 10) / 10 : 0;
    const visibilityKm = typeof visibilityMeters === 'number'
      ? Math.round((visibilityMeters / 1000) * 10) / 10
      : 10;

    return {
      uvIndex,
      visibilityKm,
      rawVisibilityMeters: typeof visibilityMeters === 'number' ? visibilityMeters : 10000,
      timestamp: json.current.time || new Date().toISOString(),
      source: 'Open-Meteo API',
    };
  } catch (error: any) {
    console.warn(`[Open-Meteo] Enrichment fetch failed: ${error.message}`);
    return null;
  }
}

/**
 * Fetches real-time Pollen index from Google Pollen API if configured.
 * Safely falls back if API key is not configured or request fails.
 */
export async function fetchGooglePollenEnrichment(
  lat: number,
  lon: number,
  apiKey: string = CONFIG.googlePollenApiKey
): Promise<{ available: boolean; data: GooglePollenData | null; error?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      available: false,
      data: null,
      error: 'GOOGLE_POLLEN_API_KEY is not configured on backend environment',
    };
  }

  const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${encodeURIComponent(apiKey)}&location.latitude=${lat}&location.longitude=${lon}&days=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000), // 6-second timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Google Pollen API] HTTP ${response.status}: ${errText}`);
      return {
        available: false,
        data: null,
        error: `Google Pollen API returned HTTP ${response.status}`,
      };
    }

    const json: any = await response.json();
    const dailyInfo = json?.dailyInfo?.[0];

    if (!dailyInfo) {
      return {
        available: false,
        data: null,
        error: 'No daily pollen forecast returned for this location',
      };
    }

    const rawTypes: any[] = dailyInfo.pollenTypeInfo || [];
    const types: PollenTypeDetail[] = rawTypes.map((t) => ({
      code: t.code || 'UNKNOWN',
      displayName: t.displayName || t.code || 'Pollen',
      inSeason: !!t.inSeason,
      indexValue: t.indexInfo?.value ?? 0,
      category: t.indexInfo?.category || 'None',
    }));

    // Find the highest index value among in-season or all types
    let maxIndex = 0;
    let dominantType = 'None';
    let overallCategory = 'None';

    for (const t of types) {
      if (t.indexValue > maxIndex) {
        maxIndex = t.indexValue;
        dominantType = t.displayName;
        overallCategory = t.category;
      }
    }

    if (maxIndex === 0 && types.length > 0) {
      dominantType = types[0].displayName;
      overallCategory = types[0].category;
    }

    const pollenData: GooglePollenData = {
      available: true,
      indexValue: maxIndex,
      category: overallCategory,
      dominantPollenType: dominantType,
      types,
      timestamp: new Date().toISOString(),
      source: 'Google Pollen API',
    };

    return {
      available: true,
      data: pollenData,
    };
  } catch (error: any) {
    console.warn(`[Google Pollen API] Fetch failed: ${error.message}`);
    return {
      available: false,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Combines Open-Meteo and Google Pollen enrichments for a given city in parallel.
 * Wrapped in Promise.allSettled to ensure fault isolation.
 */
export async function getExternalWeatherEnrichment(cityName: string): Promise<ExternalWeatherData> {
  const station = resolveCityStation(cityName);
  const { lat, lon } = station;

  const [openMeteoResult, pollenResult] = await Promise.allSettled([
    fetchOpenMeteoEnrichment(lat, lon),
    fetchGooglePollenEnrichment(lat, lon, CONFIG.googlePollenApiKey),
  ]);

  const openMeteoData = openMeteoResult.status === 'fulfilled' ? openMeteoResult.value : null;
  const pollenRes = pollenResult.status === 'fulfilled'
    ? pollenResult.value
    : { available: false, data: null, error: 'Pollen enrichment promise rejected' };

  return {
    openMeteo: {
      available: !!openMeteoData,
      data: openMeteoData,
      error: openMeteoData ? undefined : 'Open-Meteo enrichment unavailable or timed out',
    },
    pollen: {
      available: pollenRes.available,
      data: pollenRes.data,
      error: pollenRes.error,
    },
    enrichedAt: new Date().toISOString(),
  };
}
