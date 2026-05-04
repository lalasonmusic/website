"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
};

/**
 * Horizontal carousel with snap + edge peek. Each child is a card.
 * Pattern inspired by Spotify Web / Apple Music: cards snap to start,
 * the next one peeks on the right edge to signal "more available".
 *
 * - Desktop: arrow buttons to scroll one viewport-width at a time
 * - Mobile: native swipe with mandatory snap
 * - All cards remain in DOM (good for SEO + a11y) — only visibility shifts
 */
export default function BoutiqueCarousel({ children }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const epsilon = 4;
    setCanScrollLeft(el.scrollLeft > epsilon);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - epsilon);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByAmount(direction: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll by ~1 card-width (first child) so the snap lands on the next card
    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.getBoundingClientRect().width : el.clientWidth * 0.85;
    const gap = 16;
    const amount = (cardWidth + gap) * (direction === "left" ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow (desktop only, hidden on touch via CSS) */}
      <button
        type="button"
        onClick={() => scrollByAmount("left")}
        disabled={!canScrollLeft}
        aria-label="Précédent"
        className="boutique-carousel-arrow boutique-carousel-arrow-left"
        style={{
          opacity: canScrollLeft ? 1 : 0,
          pointerEvents: canScrollLeft ? "auto" : "none",
        }}
      >
        <ChevronLeft size={20} strokeWidth={2.25} />
      </button>

      <button
        type="button"
        onClick={() => scrollByAmount("right")}
        disabled={!canScrollRight}
        aria-label="Suivant"
        className="boutique-carousel-arrow boutique-carousel-arrow-right"
        style={{
          opacity: canScrollRight ? 1 : 0,
          pointerEvents: canScrollRight ? "auto" : "none",
        }}
      >
        <ChevronRight size={20} strokeWidth={2.25} />
      </button>

      {/* Scroll viewport */}
      <div ref={scrollerRef} className="boutique-carousel-viewport">
        {children}
      </div>
    </div>
  );
}
