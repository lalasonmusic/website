import posthog from "posthog-js";

/**
 * Fire a PostHog event. No-ops on server-side or when opt-out is active.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}
