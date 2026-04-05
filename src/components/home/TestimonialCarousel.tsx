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
  "/testimonial-sophie.jpg",
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

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, testimonials.length, goTo]);

  if (testimonials.length === 0) return null;

  const item = testimonials[current];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <div style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>
        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid var(--color-accent)",
            boxShadow: "0 4px 20px rgba(245, 166, 35, 0.15)",
          }}>
            <img
              src={PHOTOS[current % PHOTOS.length]}
              alt={item.name}
              width={88}
              height={88}
              style={{ objectFit: "cover", display: "block", width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* Large quote mark */}
        <div style={{
          fontSize: "3rem",
          lineHeight: 1,
          color: "var(--color-accent)",
          opacity: 0.3,
          marginBottom: "-0.5rem",
          fontFamily: "Georgia, serif",
        }}>
          &ldquo;
        </div>

        {/* Quote text */}
        <p style={{
          fontSize: "1.0625rem",
          lineHeight: 1.8,
          color: "#4b5563",
          fontStyle: "italic",
          margin: "0 0 1.5rem",
          fontFamily: "var(--font-poppins, Poppins, sans-serif)",
        }}>
          {item.text}
        </p>

        {/* Name + role */}
        <p style={{
          fontWeight: 700,
          fontSize: "0.9375rem",
          color: "#1b3a4b",
          margin: 0,
        }}>
          {item.name}
        </p>
        <p style={{
          fontSize: "0.8125rem",
          color: "#9ca3af",
          margin: "0.25rem 0 0",
        }}>
          {item.role}
        </p>
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
              backgroundColor: i === current ? "var(--color-accent)" : "rgba(27, 58, 75, 0.15)",
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
