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

const PHOTOS = [
  "/testimonial-lucas.jpg",
  "/testimonial-camille.jpg",
  "/testimonial-comptoir.jpg",
];

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

        {/* Photo + name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: "2px solid rgba(245, 166, 35, 0.4)",
          }}>
            <img
              src={PHOTOS[current % PHOTOS.length]}
              alt={item.name}
              width={56}
              height={56}
              style={{ objectFit: "cover", display: "block", width: "100%", height: "100%" }}
            />
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
