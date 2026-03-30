"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = "https://eu.i.posthog.com"; // EU datacenter (RGPD)
const CONSENT_KEY = "lalason_cookie_consent";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      opt_out_capturing_by_default: true, // wait for explicit consent
      autocapture: false,
      capture_pageview: false,
    });

    // Restore consent from previous session
    if (localStorage.getItem(CONSENT_KEY) === "accepted") {
      posthog.opt_in_capturing();
    }

    // Listen for real-time consent changes from CookieBanner
    const handleConsent = (e: Event) => {
      const { detail } = e as CustomEvent<"accepted" | "declined">;
      if (detail === "accepted") {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    };

    window.addEventListener("lalason:consent", handleConsent);
    return () => window.removeEventListener("lalason:consent", handleConsent);
  }, []);

  return <>{children}</>;
}
