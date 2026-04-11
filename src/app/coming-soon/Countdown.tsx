"use client";

import { useEffect, useState } from "react";

const TARGET_ISO = "2026-04-14T00:00:00+02:00";

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function computeRemaining(): TimeParts {
  const now = Date.now();
  const target = new Date(TARGET_ISO).getTime();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

export function Countdown() {
  const [parts, setParts] = useState<TimeParts | null>(null);

  useEffect(() => {
    setParts(computeRemaining());
    const id = setInterval(() => setParts(computeRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const display = parts ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
      aria-live="polite"
    >
      <Unit label="Jours" value={display.days} />
      <Unit label="Heures" value={display.hours} />
      <Unit label="Minutes" value={display.minutes} />
      <Unit label="Secondes" value={display.seconds} />
    </div>
  );
}

function Unit({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        minWidth: "5.5rem",
        padding: "1rem 1.25rem",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-poppins)",
          fontWeight: 800,
          fontSize: "2.5rem",
          lineHeight: 1,
          color: "var(--color-accent)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
