import type { WeatherAlert } from '../types/alerts';
import type { NotificationPreferences, NotificationDeliveryDecision } from '../types/notifications';

/**
 * Parses "HH:MM" 24-hour string to minutes from midnight.
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Checks whether a given "HH:MM" time falls within the quiet hours range.
 * Supports both same-day (e.g., 13:00 to 15:00) and overnight (e.g., 22:00 to 07:00) ranges.
 */
export function isTimeInQuietHours(
  currentTimeStr: string,
  startStr: string,
  endStr: string
): boolean {
  const current = parseTimeToMinutes(currentTimeStr);
  const start = parseTimeToMinutes(startStr);
  const end = parseTimeToMinutes(endStr);

  if (start <= end) {
    // Same-day range: e.g. 13:00 (780) to 15:00 (900)
    return current >= start && current < end;
  } else {
    // Overnight range: e.g. 22:00 (1320) to 07:00 (420)
    return current >= start || current < end;
  }
}

/**
 * Gets current local device time in "HH:MM" format.
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Deterministically evaluates whether an alert should be delivered as an in-app notification.
 *
 * Rules:
 * 1. Critical safety alerts ALWAYS delivered unconditionally (cannot be suppressed).
 * 2. If notifications globally disabled, non-critical alerts are suppressed.
 * 3. If quiet hours active, non-critical alerts are suppressed.
 * 4. Severity settings control non-critical alerts.
 * 5. Category settings control non-critical alerts.
 * 6. Alert objects are NEVER mutated.
 */
export function evaluateNotificationDelivery(
  alert: WeatherAlert,
  preferences: NotificationPreferences,
  currentTime?: string
): NotificationDeliveryDecision {
  // 1. Critical Safety Override Guarantee (Cannot be disabled by any setting or quiet hours)
  if (alert.severity === 'critical' || alert.category === 'safety') {
    return {
      alert,
      delivered: true,
      reason: 'Critical safety alert — delivered unconditionally regardless of notification preferences or quiet hours.',
      rule: 'critical_safety_override',
    };
  }

  // 2. Global Master Toggle
  if (!preferences.enabled) {
    return {
      alert,
      delivered: false,
      reason: 'Suppressed because in-app weather notifications are globally disabled.',
      rule: 'global_disabled',
    };
  }

  // 3. Quiet Hours Filter
  const evalTime = currentTime || getCurrentTimeString();
  if (
    preferences.quietHoursEnabled &&
    isTimeInQuietHours(evalTime, preferences.quietHoursStart, preferences.quietHoursEnd)
  ) {
    return {
      alert,
      delivered: false,
      reason: `Suppressed because notifications are currently paused during quiet hours (${preferences.quietHoursStart} - ${preferences.quietHoursEnd}).`,
      rule: 'quiet_hours',
    };
  }

  // 4. Severity Filter
  if (alert.severity === 'high' && !preferences.highSeverityEnabled) {
    return {
      alert,
      delivered: false,
      reason: 'Suppressed because high-priority notifications are disabled in preferences.',
      rule: 'severity_filter',
    };
  }

  if (alert.severity === 'medium' && !preferences.mediumSeverityEnabled) {
    return {
      alert,
      delivered: false,
      reason: 'Suppressed because medium-priority notifications are disabled in preferences.',
      rule: 'severity_filter',
    };
  }

  if (alert.severity === 'low' && !preferences.lowSeverityEnabled) {
    return {
      alert,
      delivered: false,
      reason: 'Suppressed because low-priority informational notifications are disabled in preferences.',
      rule: 'severity_filter',
    };
  }

  // 5. Category Filter
  if (!preferences.categories[alert.category]) {
    return {
      alert,
      delivered: false,
      reason: `Suppressed because ${alert.category} notifications are disabled in preferences.`,
      rule: 'category_filter',
    };
  }

  // 6. Approved Delivery
  return {
    alert,
    delivered: true,
    reason: `Delivered because ${alert.category} alert matches your severity and category preferences.`,
    rule: 'approved',
  };
}

/**
 * Returns complete delivery evaluation decisions for a list of alerts.
 */
export function getNotificationDeliveryDecisions(
  alerts: WeatherAlert[],
  preferences: NotificationPreferences,
  currentTime?: string
): NotificationDeliveryDecision[] {
  return alerts.map((alert) => evaluateNotificationDelivery(alert, preferences, currentTime));
}

/**
 * Returns only the alerts approved for in-app notification delivery.
 */
export function getDeliveredAlerts(
  alerts: WeatherAlert[],
  preferences: NotificationPreferences,
  currentTime?: string
): WeatherAlert[] {
  const decisions = getNotificationDeliveryDecisions(alerts, preferences, currentTime);
  return decisions.filter((d) => d.delivered).map((d) => d.alert);
}
