"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { TrackCategory } from "@/types/track";

type Props = {
  categories: TrackCategory[];
  searchPlaceholder: string;
  filterLabels: { style: string; theme: string; mood: string; all: string };
};

export default function CatalogueFilters({ categories, searchPlaceholder, filterLabels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") ?? "";
  const currentStyle = searchParams.get("style") ?? "";
  const currentTheme = searchParams.get("theme") ?? "";
  const currentMood = searchParams.get("mood") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const styles = categories.filter((c) => c.type === "STYLE");
  const themes = categories.filter((c) => c.type === "THEME");
  const moods = categories.filter((c) => c.type === "MOOD");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
      {/* Search */}
      <input
        type="search"
        defaultValue={currentSearch}
        placeholder={searchPlaceholder}
        onChange={(e) => {
          const val = e.target.value;
          const timer = setTimeout(() => handleSearch(val), 400);
          return () => clearTimeout(timer);
        }}
        style={{
          width: "100%",
          padding: "0.625rem 1rem",
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-primary)",
          fontSize: "0.9375rem",
        }}
      />

      {/* Filter rows */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <FilterGroup
          label={filterLabels.style}
          options={styles}
          current={currentStyle}
          allLabel={filterLabels.all}
          onChange={(v) => updateParam("style", v)}
        />
        <FilterGroup
          label={filterLabels.theme}
          options={themes}
          current={currentTheme}
          allLabel={filterLabels.all}
          onChange={(v) => updateParam("theme", v)}
        />
        <FilterGroup
          label={filterLabels.mood}
          options={moods}
          current={currentMood}
          allLabel={filterLabels.all}
          onChange={(v) => updateParam("mood", v)}
        />
      </div>
    </div>
  );
}

type FilterGroupProps = {
  label: string;
  options: TrackCategory[];
  current: string;
  allLabel: string;
  onChange: (v: string) => void;
};

function FilterGroup({ label, options, current, allLabel, onChange }: FilterGroupProps) {
  if (options.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginRight: "0.25rem" }}>
        {label}:
      </span>
      <FilterChip
        label={allLabel}
        active={!current}
        onClick={() => onChange("")}
      />
      {options.map((opt) => (
        <FilterChip
          key={opt.slug}
          label={opt.labelFr}
          active={current === opt.slug}
          onClick={() => onChange(current === opt.slug ? "" : opt.slug)}
        />
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        backgroundColor: active ? "rgba(245,166,35,0.15)" : "transparent",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        fontSize: "0.8125rem",
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
