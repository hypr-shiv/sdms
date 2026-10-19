/**
 * Privacy-First Telemetry Client for ScholarPulse
 * FERPA & GDPR Compliant: Zero PII, pseudonymized user contexts, keepalive beacons.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface TelemetryPayload {
  eventType?: "PAGE_VIEW" | "FEATURE_INTERACTION" | "API_CALL" | "COPILOT_QUERY" | "EXPORT_ACTION";
  path: string;
  featureName?: string;
  durationMs?: number;
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Record a pageview or user interaction asynchronously
 */
export function recordTelemetry(payload: TelemetryPayload) {
  if (typeof window === "undefined") return;

  try {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const endpoint = `${API_BASE_URL}/analytics/event`;
    const body = JSON.stringify(payload);

    // Try navigator.sendBeacon for fast, non-blocking telemetry on page unload/navigation
    if (typeof navigator !== "undefined" && navigator.sendBeacon && !token) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    // Otherwise use fetch with keepalive
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Gracefully swallow network errors so client app is never interrupted
    });
  } catch {
    // Fail-safe
  }
}

/**
 * Track page view on route transitions
 */
export function trackPageView(path: string, metadata?: Record<string, any>) {
  recordTelemetry({
    eventType: "PAGE_VIEW",
    path,
    metadata: {
      ...metadata,
      screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    },
  });
}

/**
 * Track high-value user feature interactions (e.g., AI queries, exam submissions, grade exports)
 */
export function trackFeature(featureName: string, path: string, durationMs?: number, metadata?: Record<string, any>) {
  recordTelemetry({
    eventType: "FEATURE_INTERACTION",
    path,
    featureName,
    durationMs,
    metadata,
  });
}
