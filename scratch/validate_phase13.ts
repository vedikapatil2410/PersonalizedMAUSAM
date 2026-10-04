/**
 * Phase 13 — Personalized Notification Preferences & In-App Delivery
 * Validation Script — 20 Deterministic Test Cases
 *
 * Run via: npx tsx scratch/validate_phase13.ts
 * (scratch/ is excluded from root tsconfig, so tsx runs it directly)
 */

import { getDemoWeatherScenario } from '../src/constants/demoWeather';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/constants/notificationPreferences';
import { generatePersonalizedAlerts } from '../src/services/alertEngine';
import {
  isTimeInQuietHours,
  getNotificationDeliveryDecisions,
  getDeliveredAlerts,
} from '../src/services/notificationEngine';
import type { NotificationPreferences } from '../src/types/notifications';
import type { AppState } from '../src/types';

// ─── ANSI Colours ────────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ─── Test Runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description: string, fn: () => void): void {
  try {
    fn();
    console.log(`${GREEN}✔${RESET}  ${description}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${RED}✘${RESET}  ${description}`);
    console.log(`   ${RED}→ ${msg}${RESET}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Shared Test Fixtures ─────────────────────────────────────────────────────

const BASE_USER_STATE: AppState = {
  selectedPersonas: ['health', 'fitness', 'commuting'],
  selectedPreferences: ['temperature', 'humidity'],
  selectedLocation: 'Pune',
  onboardingCompleted: true,
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
};

const ALL_PERSONAS_USER_STATE: AppState = {
  ...BASE_USER_STATE,
  selectedPersonas: ['health', 'fitness', 'travel', 'agriculture', 'commuting', 'family', 'outdoor', 'events'],
};

const NORMAL_WEATHER = getDemoWeatherScenario('NORMAL').weatherData;
const HOT_SUNNY_WEATHER = getDemoWeatherScenario('HOT_SUNNY').weatherData;
const RAINY_WEATHER = getDemoWeatherScenario('RAINY').weatherData;
const HIGH_UV_WEATHER = getDemoWeatherScenario('HIGH_UV').weatherData;
const SEVERE_WEATHER = getDemoWeatherScenario('SEVERE_WEATHER').weatherData;

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Phase 13 — Notification Preferences & Delivery Validation${RESET}`);
console.log('═'.repeat(60));

// TEST 1 — Default preferences initialized correctly
test('T01: Default preferences have correct structure and safe defaults', () => {
  const prefs = DEFAULT_NOTIFICATION_PREFERENCES;
  assert(prefs.enabled === true, 'enabled should default to true');
  assert(prefs.criticalSafetyEnabled === true, 'criticalSafetyEnabled must be true');
  assert(prefs.highSeverityEnabled === true, 'highSeverityEnabled should default to true');
  assert(prefs.mediumSeverityEnabled === true, 'mediumSeverityEnabled should default to true');
  assert(prefs.lowSeverityEnabled === false, 'lowSeverityEnabled should default to false');
  assert(prefs.quietHoursEnabled === false, 'quietHoursEnabled should default to false');
  assert(prefs.quietHoursStart === '22:00', 'quietHoursStart should default to 22:00');
  assert(prefs.quietHoursEnd === '07:00', 'quietHoursEnd should default to 07:00');
  const categories = Object.keys(prefs.categories);
  assert(categories.length >= 10, `Expected ≥10 categories, got ${categories.length}`);
  for (const [cat, val] of Object.entries(prefs.categories)) {
    assert(val === true, `Category '${cat}' should default to true`);
  }
});

// TEST 2 — NORMAL scenario produces 0 alerts
test('T02: NORMAL scenario produces 0 alerts (nothing to notify)', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: NORMAL_WEATHER,
    userState: BASE_USER_STATE,
    dataMode: 'demo',
  });
  assert(alerts.length === 0, `Expected 0 alerts for NORMAL, got ${alerts.length}`);
});

// TEST 3 — HOT_SUNNY scenario produces alerts under default preferences
test('T03: HOT_SUNNY scenario produces ≥1 alert with all-persona user', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  assert(alerts.length >= 1, `Expected ≥1 alert for HOT_SUNNY, got ${alerts.length}`);
  const decisions = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  const delivered = decisions.filter((d) => d.delivered);
  assert(delivered.length >= 1, `Expected ≥1 delivered notification for HOT_SUNNY, got ${delivered.length}`);
});

// TEST 4 — RAINY scenario produces alerts under default preferences
test('T04: RAINY scenario produces ≥1 alert with all-persona user', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: RAINY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  assert(alerts.length >= 1, `Expected ≥1 alert for RAINY, got ${alerts.length}`);
  const delivered = getDeliveredAlerts(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  assert(delivered.length >= 1, `Expected ≥1 delivered notification for RAINY, got ${delivered.length}`);
});

// TEST 5 — HIGH_UV scenario produces alerts under default preferences
test('T05: HIGH_UV scenario produces ≥1 alert with all-persona user', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HIGH_UV_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  assert(alerts.length >= 1, `Expected ≥1 alert for HIGH_UV, got ${alerts.length}`);
  const delivered = getDeliveredAlerts(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  assert(delivered.length >= 1, `Expected ≥1 delivered for HIGH_UV, got ${delivered.length}`);
});

// TEST 6 — SEVERE_WEATHER always delivers critical alert
test('T06: SEVERE_WEATHER always produces a critical alert at index 0', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  assert(alerts.length >= 1, 'Expected ≥1 alert for SEVERE_WEATHER');
  assert(
    alerts[0].severity === 'critical',
    `Expected first alert severity=critical, got ${alerts[0].severity}`
  );
  const decisions = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  const criticalDecision = decisions.find((d) => d.alert.severity === 'critical');
  assert(criticalDecision !== undefined, 'Expected a critical decision');
  assert(criticalDecision!.delivered === true, 'Critical alert must be delivered');
  assert(criticalDecision!.rule === 'critical_safety_override', 'Rule must be critical_safety_override');
});

// TEST 7 — Critical alert bypasses global disabled
test('T07: Critical alert delivered even when notifications globally disabled', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const globallyOff: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    enabled: false,
  };
  const decisions = getNotificationDeliveryDecisions(alerts, globallyOff);
  const criticalDecision = decisions.find((d) => d.alert.severity === 'critical');
  assert(criticalDecision !== undefined, 'Expected a critical decision');
  assert(criticalDecision!.delivered === true, 'Critical must bypass global disabled');
  assert(criticalDecision!.rule === 'critical_safety_override', 'Rule must be critical_safety_override');
});

// TEST 8 — Critical alert bypasses category filter
test('T08: Critical alert delivered even when its category is disabled', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const criticalAlert = alerts.find((a) => a.severity === 'critical');
  assert(criticalAlert !== undefined, 'Expected a critical alert to exist');

  const catOff: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    categories: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
      safety: false, // even if safety category disabled
    },
  };
  const decisions = getNotificationDeliveryDecisions([criticalAlert!], catOff);
  assert(decisions[0].delivered === true, 'Critical must bypass category filter');
  assert(decisions[0].rule === 'critical_safety_override', 'Rule must be critical_safety_override');
});

// TEST 9 — Critical alert bypasses quiet hours
test('T09: Critical alert delivered during quiet hours', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const criticalAlert = alerts.find((a) => a.severity === 'critical');
  assert(criticalAlert !== undefined, 'Expected a critical alert');

  const quietPrefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    quietHoursEnabled: true,
    quietHoursStart: '00:00',
    quietHoursEnd: '23:59', // entire day quiet
  };
  // Pass currentTime = '12:00' which is inside quiet hours
  const decisions = getNotificationDeliveryDecisions([criticalAlert!], quietPrefs, '12:00');
  assert(decisions[0].delivered === true, 'Critical must bypass quiet hours');
  assert(decisions[0].rule === 'critical_safety_override', 'Rule must be critical_safety_override');
});

// TEST 10 — Non-critical suppressed by global disable
test('T10: Non-critical alert suppressed when notifications globally disabled', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const nonCritical = alerts.filter((a) => a.severity !== 'critical' && a.category !== 'safety');
  assert(nonCritical.length >= 1, 'Expected ≥1 non-critical alert for HOT_SUNNY');

  const disabledPrefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    enabled: false,
  };
  const decisions = getNotificationDeliveryDecisions(nonCritical, disabledPrefs);
  for (const d of decisions) {
    assert(d.delivered === false, `Non-critical "${d.alert.title}" should be suppressed when disabled`);
    assert(d.rule === 'global_disabled', `Rule should be global_disabled, got ${d.rule}`);
  }
});

// TEST 11 — Non-critical respects severity settings (high disabled)
test('T11: High-severity non-critical alerts suppressed when highSeverityEnabled=false', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const highAlerts = alerts.filter((a) => a.severity === 'high' && a.category !== 'safety');
  if (highAlerts.length === 0) {
    console.log(`   ${YELLOW}(skip — no high-severity non-safety alerts in HOT_SUNNY for test personas)${RESET}`);
    return;
  }
  const noHighPrefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    highSeverityEnabled: false,
  };
  const decisions = getNotificationDeliveryDecisions(highAlerts, noHighPrefs);
  for (const d of decisions) {
    assert(d.delivered === false, `High alert "${d.alert.title}" should be suppressed`);
    assert(d.rule === 'severity_filter', `Rule should be severity_filter, got ${d.rule}`);
  }
});

// TEST 12 — Non-critical respects category settings
test('T12: Health category alerts suppressed when health category disabled', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const healthAlerts = alerts.filter((a) => a.category === 'health' && a.severity !== 'critical');
  if (healthAlerts.length === 0) {
    console.log(`   ${YELLOW}(skip — no health alerts in HOT_SUNNY for test personas)${RESET}`);
    return;
  }
  const noHealthPrefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    categories: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
      health: false,
    },
  };
  const decisions = getNotificationDeliveryDecisions(healthAlerts, noHealthPrefs);
  for (const d of decisions) {
    assert(d.delivered === false, `Health alert "${d.alert.title}" should be suppressed`);
    assert(d.rule === 'category_filter', `Rule should be category_filter, got ${d.rule}`);
  }
});

// TEST 13 — Quiet hours suppress non-critical
test('T13: Quiet hours suppress non-critical alerts when active', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const nonCritical = alerts.filter((a) => a.severity !== 'critical' && a.category !== 'safety');
  if (nonCritical.length === 0) {
    console.log(`   ${YELLOW}(skip — no non-critical non-safety alerts in HOT_SUNNY)${RESET}`);
    return;
  }
  const quietPrefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };
  // '23:00' is in overnight quiet range (22:00→07:00)
  const decisions = getNotificationDeliveryDecisions(nonCritical, quietPrefs, '23:00');
  for (const d of decisions) {
    assert(d.delivered === false, `"${d.alert.title}" should be suppressed in quiet hours`);
    assert(d.rule === 'quiet_hours', `Rule should be quiet_hours, got ${d.rule}`);
  }
});

// TEST 14 — Overnight quiet hours work correctly
test('T14: isTimeInQuietHours handles overnight range (22:00→07:00) correctly', () => {
  const start = '22:00';
  const end = '07:00';
  // Inside overnight range
  assert(isTimeInQuietHours('22:00', start, end) === true, '22:00 should be in quiet hours');
  assert(isTimeInQuietHours('00:00', start, end) === true, '00:00 should be in quiet hours');
  assert(isTimeInQuietHours('03:30', start, end) === true, '03:30 should be in quiet hours');
  assert(isTimeInQuietHours('06:59', start, end) === true, '06:59 should be in quiet hours');
  // Outside overnight range
  assert(isTimeInQuietHours('07:00', start, end) === false, '07:00 should NOT be in quiet hours');
  assert(isTimeInQuietHours('12:00', start, end) === false, '12:00 should NOT be in quiet hours');
  assert(isTimeInQuietHours('21:59', start, end) === false, '21:59 should NOT be in quiet hours');
});

// TEST 15 — Alert objects are NOT mutated
test('T15: Alert objects are not mutated by notification engine', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: HOT_SUNNY_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  // Snapshot titles before
  const titlesBefore = alerts.map((a) => a.title);
  const idsBefore = alerts.map((a) => a.id);

  getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  getDeliveredAlerts(alerts, DEFAULT_NOTIFICATION_PREFERENCES);

  // Verify unchanged
  const titlesAfter = alerts.map((a) => a.title);
  const idsAfter = alerts.map((a) => a.id);
  for (let i = 0; i < alerts.length; i++) {
    assert(titlesBefore[i] === titlesAfter[i], `Alert[${i}] title was mutated`);
    assert(idsBefore[i] === idsAfter[i], `Alert[${i}] id was mutated`);
  }
});

// TEST 16 — Alert ordering is deterministic
test('T16: Alert ordering is deterministic across repeated calls', () => {
  const run1 = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const run2 = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  assert(run1.length === run2.length, `Run1 length ${run1.length} ≠ Run2 length ${run2.length}`);
  for (let i = 0; i < run1.length; i++) {
    assert(run1[i].id === run2[i].id, `Alert[${i}] id differs between runs: ${run1[i].id} vs ${run2[i].id}`);
  }
});

// TEST 17 — Delivery decisions include reason strings
test('T17: Every delivery decision includes a non-empty reason string', () => {
  const alerts = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const decisions = getNotificationDeliveryDecisions(alerts, DEFAULT_NOTIFICATION_PREFERENCES);
  for (const d of decisions) {
    assert(typeof d.reason === 'string' && d.reason.length > 0, `Decision for "${d.alert.title}" has empty reason`);
    assert(typeof d.rule === 'string' && d.rule.length > 0, `Decision for "${d.alert.title}" has empty rule`);
  }
});

// TEST 18 — Phase 12 alert count/content is unchanged by Phase 13
test('T18: Phase 13 does not change Phase 12 alert count or content', () => {
  // Alerts generated before notification evaluation
  const alertsBefore = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });
  const countBefore = alertsBefore.length;

  // Run notification engine
  getNotificationDeliveryDecisions(alertsBefore, DEFAULT_NOTIFICATION_PREFERENCES);
  const alertsAfter = generatePersonalizedAlerts({
    weatherData: SEVERE_WEATHER,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'demo',
  });

  assert(countBefore === alertsAfter.length, `Alert count changed: ${countBefore} → ${alertsAfter.length}`);
  for (let i = 0; i < alertsBefore.length; i++) {
    assert(alertsBefore[i].title === alertsAfter[i].title, `Alert[${i}] title changed`);
    assert(alertsBefore[i].severity === alertsAfter[i].severity, `Alert[${i}] severity changed`);
  }
});

// TEST 19 — Live IMD unavailable fields don't produce notifications
test('T19: Live IMD unavailable fields (rainfall=0, rainProb=0, uvIndex=0) produce no unsafe alerts', () => {
  // Simulate a Live IMD-style WeatherData with unavailable fields set to 0
  const liveImdWeather = {
    location: 'Pune',
    timestamp: 'Live IMD • 10:00 AM',
    temperature: 31,
    feelsLike: 33,
    humidity: 62,
    rainfall: 0,         // unavailable
    rainProbability: 0,  // unavailable
    windSpeed: 18,
    windDirection: 'NW',
    uvIndex: 0,          // unavailable
    visibility: 0,       // unavailable
    weatherCondition: 'partly_cloudy' as const,
    sunrise: '06:10 AM',
    sunset: '06:48 PM',
    severity: 'normal' as const,
    summary: 'Live IMD observation. Some fields unavailable.',
  };

  const alerts = generatePersonalizedAlerts({
    weatherData: liveImdWeather,
    userState: ALL_PERSONAS_USER_STATE,
    dataMode: 'live',
  });

  // rainfall=0 should NOT trigger heavy rain alerts
  const rainfallAlerts = alerts.filter(
    (a) => a.message.toLowerCase().includes('rainfall') && a.message.includes('28')
  );
  assert(rainfallAlerts.length === 0, 'No rainfall alerts should reference 28mm (demo) in live mode');

  // uvIndex=0 should NOT trigger UV alerts (0 is not ≥ 8)
  const uvAlerts = alerts.filter(
    (a) => a.category === 'health' && a.message.toLowerCase().includes('uv index 0')
  );
  assert(uvAlerts.length === 0, 'No UV alerts should be fabricated for uvIndex=0');

  console.log(`   → ${alerts.length} alert(s) generated for live IMD-style data (expected ≥0)`);
});

// TEST 20 — Type compatibility: NotificationPreferences satisfies interface shape
test('T20: Type compatibility — DEFAULT_NOTIFICATION_PREFERENCES satisfies full interface', () => {
  const prefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  // Structural check — all required fields present
  assert('enabled' in prefs, 'Missing: enabled');
  assert('criticalSafetyEnabled' in prefs, 'Missing: criticalSafetyEnabled');
  assert('highSeverityEnabled' in prefs, 'Missing: highSeverityEnabled');
  assert('mediumSeverityEnabled' in prefs, 'Missing: mediumSeverityEnabled');
  assert('lowSeverityEnabled' in prefs, 'Missing: lowSeverityEnabled');
  assert('categories' in prefs, 'Missing: categories');
  assert('quietHoursEnabled' in prefs, 'Missing: quietHoursEnabled');
  assert('quietHoursStart' in prefs, 'Missing: quietHoursStart');
  assert('quietHoursEnd' in prefs, 'Missing: quietHoursEnd');
  // criticalSafetyEnabled is literal type true — runtime value must be true
  assert(prefs.criticalSafetyEnabled === true, 'criticalSafetyEnabled literal type must be true');
  // categories must cover all 10 categories
  const required = ['safety','health','fitness','travel','agriculture','commuting','family','outdoor','events','general'];
  for (const cat of required) {
    assert(cat in prefs.categories, `Missing category: ${cat}`);
  }
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('─'.repeat(60));
const total = passed + failed;
if (failed === 0) {
  console.log(`${GREEN}${BOLD}ALL ${total} TESTS PASSED${RESET}`);
} else {
  console.log(`${RED}${BOLD}${failed} of ${total} TESTS FAILED${RESET} (${GREEN}${passed} passed${RESET})`);
}
console.log('─'.repeat(60));

if (failed > 0) process.exit(1);
