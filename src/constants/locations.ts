import type { WeatherLocation, SupportedCity } from '../types/locations';

export interface LocationOption {
  id: string;
  name: string;
  region: string;
  isDefault?: boolean;
  isSpecial?: boolean;
}

/**
 * Supported IMD observation cities.
 */
export const SUPPORTED_CITIES: SupportedCity[] = [
  {
    id: 'pune',
    city: 'Pune',
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    defaultLabel: 'Home',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    defaultLabel: 'Travel',
  },
  {
    id: 'delhi',
    city: 'Delhi',
    name: 'Delhi',
    state: 'National Capital Territory',
    country: 'India',
    defaultLabel: 'Saved Location',
  },
];

/**
 * Initial deterministic saved locations list.
 */
export const DEFAULT_SAVED_LOCATIONS: WeatherLocation[] = [
  {
    id: 'pune',
    name: 'Pune',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    label: 'Home',
    isCurrentLocation: true,
    isDefault: true,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    label: 'Travel',
    isCurrentLocation: false,
    isDefault: false,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    city: 'Delhi',
    state: 'National Capital Territory',
    country: 'India',
    label: 'Saved Location',
    isCurrentLocation: false,
    isDefault: false,
  },
];

/**
 * Maximum saved locations limit.
 */
export const MAX_SAVED_LOCATIONS = 5;

/**
 * Suggested user tags/labels.
 */
export const LOCATION_LABEL_OPTIONS = [
  'Home',
  'College',
  'Travel',
  'Work',
  'Family',
  'Other',
];

/**
 * Backward-compatible location options used in onboarding setup.
 */
export const LOCATION_OPTIONS: LocationOption[] = [
  {
    id: 'pune',
    name: 'Pune',
    region: 'Maharashtra',
    isDefault: true,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'Maharashtra',
  },
  {
    id: 'delhi',
    name: 'Delhi',
    region: 'National Capital Territory',
  },
  {
    id: 'choose_later',
    name: 'Choose Later',
    region: 'Set location on dashboard',
    isSpecial: true,
  },
];

export const DEFAULT_LOCATION = 'Pune';
