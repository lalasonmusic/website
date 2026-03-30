"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function SubscriptionActiveTracker() {
  useEffect(() => {
    track("subscription_active");
  }, []);
  return null;
}
