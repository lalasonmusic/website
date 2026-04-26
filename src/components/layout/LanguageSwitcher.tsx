"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      // pathname is the route template (e.g. "/blog/[slug]"); params provides
      // the dynamic values. Cast bypasses the strict typed-pathname overload
      // — combined navigation works at runtime for any route.
      router.replace(
        // @ts-expect-error -- typed-pathnames overload doesn't infer dynamic combos
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
      <button
        onClick={() => switchLocale("fr")}
        disabled={isPending}
        style={{
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          fontWeight: locale === "fr" ? 600 : 400,
          color: locale === "fr" ? "var(--color-accent)" : "var(--color-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-poppins)",
        }}
      >
        FR
      </button>
      <span style={{ color: "var(--color-border)", fontSize: "0.75rem" }}>|</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        style={{
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          fontWeight: locale === "en" ? 600 : 400,
          color: locale === "en" ? "var(--color-accent)" : "var(--color-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-poppins)",
        }}
      >
        EN
      </button>
    </div>
  );
}
