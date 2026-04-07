"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

function getSessionId(): string {
  const key = "lalason_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function PresenceTracker() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();

    function sendHeartbeat() {
      fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page: pathnameRef.current,
        }),
      }).catch(() => {});
    }

    // Send immediately
    sendHeartbeat();

    // Then every 30s
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also send on page change
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const sessionId = sessionStorage.getItem("lalason_session_id");
    if (!sessionId) return;

    fetch("/api/presence/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, page: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
