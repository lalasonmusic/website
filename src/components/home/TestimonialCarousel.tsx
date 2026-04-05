"use client";

import { useState, useEffect, useCallback } from "react";

type Testimonial = {
  name: string;
  role: string;
  text: string;
};

type Props = {
  testimonials: Testimonial[];
};

const AVATAR_COLORS = [
  "linear-gradient(135deg, #f5a623 0%, #e8961a 100%)",
  "linear-gradient(135deg, #3282b8 0%, #0f4c75 100%)",
  "linear-gradient(135deg, #8b3fa0 0%, #4a1a6b 100%)",
];

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestimonialCarousel({ testimonials }: Props) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  // Auto-advance every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, testimonials.length, goTo]);

  if (testimonials.length === 0) return null;

  const item = testimonials[current];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      {/* Quote */}
      <div style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>
        <p style={{
          fontSize: "1.125rem",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.85)",
          fontStyle: "italic",
          margin: "0 0 2rem",
        }}>
          &ldquo;{item.text}&rdquo;
        </p>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: AVATAR_COLORS[current % AVATAR_COLORS.length],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "0.02em",
            }}>
              {getInitials(item.name)}
            </span>
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "white", margin: 0 }}>
              {item.name}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
              {item.role}
            </p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              backgroundColor: i === current ? "var(--color-accent)" : "rgba(255,255,255,0.2)",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
