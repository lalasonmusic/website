import { db } from "@/db";
import { subscriptions, downloads, profiles } from "@/db/schema";
import { count, desc } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { Suspense } from "react";
import ClientSearch from "@/components/admin/ClientSearch";

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  created: number;
};

type Client = {
  userId: string;
  subscriptionId: string;
  email: string;
  planType: string;
  status: string;
  createdAt: Date;
  currentPeriodEnd: Date;
  downloadCount: number;
  stripeCustomerId: string | null;
  invoices: Invoice[];
  licenceNumber: string;
};

function generateLicenseNumber(subscriptionId: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const shortId = subscriptionId.substring(0, 8).toUpperCase();
  return `LIC-${year}${month}-${shortId}`;
}

async function getClients(): Promise<Client[]> {
  const subs = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planType: subscriptions.planType,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));

  const downloadCounts = await db
    .select({ userId: downloads.userId, count: count() })
    .from(downloads)
    .groupBy(downloads.userId);
  const dlMap = new Map(downloadCounts.map((d) => [d.userId, d.count]));

  // Get emails + stripe customer IDs
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email ?? "—"]) ?? []);

  const allProfiles = await db
    .select({ id: profiles.id, stripeCustomerId: profiles.stripeCustomerId })
    .from(profiles);
  const customerIdMap = new Map(allProfiles.map((p) => [p.id, p.stripeCustomerId]));

  // Fetch invoices per Stripe customer
  const invoiceMap = new Map<string, Invoice[]>();
  const uniqueCustomerIds = [...new Set(allProfiles.map((p) => p.stripeCustomerId).filter(Boolean))] as string[];

  for (const custId of uniqueCustomerIds) {
    try {
      const stripeInvoices = await stripe.invoices.list({ customer: custId, limit: 10 });
      invoiceMap.set(custId, stripeInvoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: inv.amount_paid,
        currency: inv.currency,
        created: inv.created,
      })));
    } catch {}
  }

  return subs.map((sub) => {
    const custId = customerIdMap.get(sub.userId);
    return {
      userId: sub.userId,
      subscriptionId: sub.id,
      email: emailMap.get(sub.userId) ?? "—",
      planType: sub.planType,
      status: sub.status,
      createdAt: sub.createdAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      downloadCount: dlMap.get(sub.userId) ?? 0,
      stripeCustomerId: custId ?? null,
      invoices: custId ? (invoiceMap.get(custId) ?? []) : [],
      licenceNumber: generateLicenseNumber(sub.id, sub.createdAt),
    };
  });
}

const planLabels: Record<string, string> = {
  creators_monthly: "Creators Mensuel",
  creators_annual: "Creators Annuel",
  boutique_annual: "Boutique",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  canceled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  past_due: { bg: "rgba(234,179,8,0.12)", text: "#eab308" },
};

const invoiceStatusColors: Record<string, { bg: string; text: string }> = {
  paid: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  open: { bg: "rgba(234,179,8,0.12)", text: "#eab308" },
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100);
}

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const allClients = await getClients();
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

  // Filter by search query
  const clients = q
    ? allClients.filter((c) => {
        const search = q.toLowerCase();
        return (
          c.email.toLowerCase().includes(search) ||
          c.licenceNumber.toLowerCase().includes(search) ||
          (planLabels[c.planType] ?? "").toLowerCase().includes(search)
        );
      })
    : allClients;

  const activeCount = allClients.filter((c) => c.status === "active").length;
  const canceledCount = allClients.filter((c) => c.status === "canceled").length;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>Clients</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {activeCount} actifs · {canceledCount} résiliés · {allClients.length} total
          {q && ` · ${clients.length} résultat${clients.length !== 1 ? "s" : ""} pour "${q}"`}
        </p>
        <Suspense>
          <ClientSearch />
        </Suspense>
      </div>

      {/* Client cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {clients.map((client) => {
          const colors = statusColors[client.status] ?? statusColors.canceled;
          return (
            <div
              key={`${client.userId}-${client.createdAt.toISOString()}`}
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                overflow: "hidden",
              }}
            >
              {/* Main row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 0.7fr 1fr 0.5fr",
                gap: "0.75rem",
                padding: "1rem 1.25rem",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.125rem" }}>{client.email}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", margin: 0, fontFamily: "monospace" }}>
                    {client.licenceNumber}
                  </p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                  {planLabels[client.planType] ?? client.planType}
                </p>
                <span style={{
                  fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "9999px",
                  backgroundColor: colors.bg, color: colors.text, textAlign: "center", display: "inline-block",
                }}>
                  {client.status === "active" ? "Actif" : client.status === "canceled" ? "Résilié" : client.status}
                </span>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                    {client.createdAt.toLocaleDateString("fr-FR", dateOpts)} → {client.currentPeriodEnd.toLocaleDateString("fr-FR", dateOpts)}
                  </p>
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" }}>
                  {client.downloadCount} DL
                </p>
              </div>

              {/* Documents row */}
              <div style={{
                padding: "0.625rem 1.25rem",
                borderTop: "1px solid var(--color-border)",
                backgroundColor: "rgba(255,255,255,0.02)",
                display: "flex",
                gap: "1.5rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}>
                {/* Licence PDF */}
                <a
                  href={`/api/licence/download?locale=fr&userId=${client.userId}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: "0.75rem", fontWeight: 600, color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Licence {client.licenceNumber}
                </a>

                {/* Invoices */}
                {client.invoices.length > 0 ? (
                  client.invoices.map((inv) => {
                    const invColors = invoiceStatusColors[inv.status ?? ""] ?? invoiceStatusColors.open;
                    return (
                      <a
                        key={inv.id}
                        href={`/api/membre/invoices/${inv.id}/download?locale=fr&userId=${client.userId}`}
                        target="_blank"
                        rel="noopener"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-secondary)",
                          textDecoration: "none",
                        }}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                        {inv.number ?? "Facture"}
                        <span style={{ fontSize: "0.625rem", color: invColors.text }}>
                          {formatAmount(inv.amount, inv.currency)}
                        </span>
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 600, padding: "0.1rem 0.375rem",
                          borderRadius: "9999px", backgroundColor: invColors.bg, color: invColors.text,
                        }}>
                          {inv.status === "paid" ? "Payée" : "En attente"}
                        </span>
                      </a>
                    );
                  })
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Aucune facture Stripe
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
