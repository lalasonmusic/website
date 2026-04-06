"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
};

type Props = {
  locale: string;
  labels: {
    empty: string;
    download: string;
    paid: string;
    open: string;
    uncollectible: string;
  };
};

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );
}

export default function InvoiceList({ locale, labels }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/membre/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .finally(() => setLoading(false));
  }, []);

  const statusLabel: Record<string, string> = {
    paid: labels.paid,
    open: labels.open,
    uncollectible: labels.uncollectible,
  };

  const statusColor: Record<string, { bg: string; text: string }> = {
    paid: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
    open: { bg: "rgba(234,179,8,0.12)", text: "#eab308" },
    uncollectible: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-sm text-white/30">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-white/35 py-4">{labels.empty}</p>;
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => {
        const colors = statusColor[inv.status ?? ""] ?? statusColor.open;
        return (
          <div
            key={inv.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {inv.number ?? inv.id.substring(0, 16)}
                </p>
                <p className="text-xs text-white/35">
                  {formatDate(inv.created, locale)} · {formatAmount(inv.amount, inv.currency, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: colors.bg, color: colors.text }}
              >
                {statusLabel[inv.status ?? ""] ?? inv.status}
              </span>

              {inv.pdfUrl && (
                <a
                  href={inv.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {labels.download}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
