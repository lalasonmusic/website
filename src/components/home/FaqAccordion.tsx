"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
};

export default function FaqAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: isOpen ? "rgba(0,0,0,0.03)" : "transparent",
              border: "1px solid #e5e7eb",
              transition: "background-color 0.2s",
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                gap: "1rem",
              }}
            >
              <span style={{
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "#1b3a4b",
                lineHeight: 1.4,
              }}>
                {item.question}
              </span>
              <ChevronDown
                size={18}
                color="#9ca3af"
                style={{
                  flexShrink: 0,
                  transition: "transform 0.2s",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            {isOpen && (
              <div style={{
                padding: "0 1.25rem 1rem",
              }}>
                <p style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
