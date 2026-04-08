import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type RouteContext = { params: Promise<{ id: string }> };

const planLabels: Record<string, { fr: string; en: string }> = {
  creators_monthly: { fr: "Créateurs — Mensuel", en: "Creators — Monthly" },
  creators_annual: { fr: "Créateurs — Annuel", en: "Creators — Annual" },
  boutique_annual: { fr: "Boutique — Annuel", en: "Boutique — Annual" },
};

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: invoiceId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

  // Get Stripe customer ID to verify ownership
  const [profile] = await db
    .select({ stripeCustomerId: profiles.stripeCustomerId })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile?.stripeCustomerId) {
    return new Response("No customer found", { status: 403 });
  }

  // Fetch invoice from Stripe
  let invoice;
  try {
    invoice = await stripe.invoices.retrieve(invoiceId);
  } catch {
    return new Response("Invoice not found", { status: 404 });
  }

  // Verify this invoice belongs to the user
  if (invoice.customer !== profile.stripeCustomerId) {
    return new Response("Forbidden", { status: 403 });
  }

  // Extract data
  const invoiceNumber = invoice.number ?? invoiceId.substring(0, 16).toUpperCase();
  const invoiceDate = new Date((invoice.created ?? 0) * 1000).toLocaleDateString(dateLocale, dateOpts);
  const periodStart = invoice.lines?.data?.[0]?.period?.start
    ? new Date(invoice.lines.data[0].period.start * 1000).toLocaleDateString(dateLocale, dateOpts)
    : "—";
  const periodEnd = invoice.lines?.data?.[0]?.period?.end
    ? new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString(dateLocale, dateOpts)
    : "—";

  const subtotal = invoice.subtotal ?? 0;
  const tax = (invoice.total ?? 0) - (invoice.subtotal ?? 0);
  const total = invoice.amount_paid ?? invoice.total ?? 0;
  const currency = invoice.currency ?? "eur";
  const isPaid = invoice.status === "paid";

  // Plan info from line items
  const lineItem = invoice.lines?.data?.[0];
  const planDescription = lineItem?.description ?? "Lalason Subscription";
  const planType = ((lineItem as unknown as { price?: { metadata?: { plan_type?: string } } })?.price?.metadata?.plan_type) ?? "";
  const planLabel = planLabels[planType]?.[locale] ?? planDescription;

  // Customer info — billing details (preferred) or licence holder (fallback)
  const licenceFirstName = (user.user_metadata?.licence_first_name as string) ?? "";
  const licenceLastName = (user.user_metadata?.licence_last_name as string) ?? "";
  const licenceAddress = (user.user_metadata?.licence_address as string) ?? "";

  // Billing info (company details)
  const billingCompany = (user.user_metadata?.billing_company as string) ?? "";
  const billingVat = (user.user_metadata?.billing_vat as string) ?? "";
  const billingAddress = (user.user_metadata?.billing_address as string) ?? "";
  const billingPostalCode = (user.user_metadata?.billing_postal_code as string) ?? "";
  const billingCity = (user.user_metadata?.billing_city as string) ?? "";
  const billingCountry = (user.user_metadata?.billing_country as string) ?? "";

  const personalName = [licenceFirstName, licenceLastName].filter(Boolean).join(" ");
  const customerName = billingCompany || personalName || (user.email ?? "—");

  // Build the customer address block
  const customerAddressLines: string[] = [];
  if (billingCompany && personalName) {
    customerAddressLines.push(personalName);
  }
  const streetAddress = billingAddress || licenceAddress;
  if (streetAddress) customerAddressLines.push(streetAddress);
  const cityLine = [billingPostalCode, billingCity].filter(Boolean).join(" ");
  if (cityLine) customerAddressLines.push(cityLine);
  if (billingCountry) customerAddressLines.push(billingCountry);
  if (billingVat) customerAddressLines.push(`TVA: ${billingVat}`);

  // Customer country from Stripe (fallback when billing country not set)
  const stripeCountry = invoice.customer_address?.country ?? "";
  const fallbackCountry = stripeCountry
    ? new Intl.DisplayNames([dateLocale], { type: "region" }).of(stripeCountry) ?? stripeCountry
    : "";
  if (!billingCountry && fallbackCountry && customerAddressLines.length > 0) {
    customerAddressLines.push(fallbackCountry);
  }

  // Tax rate (calculated from amounts, or from Stripe Tax when enabled)
  const taxRate = subtotal > 0 && tax > 0 ? Math.round((tax / subtotal) * 10000) / 100 : 0;

  // Payment method
  const paymentMethod = "Stripe";

  // ── Build PDF ──
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.106, 0.227, 0.294); // #1b3a4b
  const accent = rgb(0.961, 0.651, 0.137); // #f5a623
  const gray = rgb(0.45, 0.49, 0.52);
  const lightGray = rgb(0.85, 0.87, 0.88);
  const white = rgb(1, 1, 1);
  const green = rgb(0.13, 0.77, 0.37);

  let y = 780;
  const left = 50;
  const right = 545;
  const lineH = 17;

  // ── Header bar ──
  page.drawRectangle({ x: 0, y: 800, width: 595, height: 42, color: dark });
  page.drawText("LALASON", { x: left, y: 812, font: bold, size: 16, color: white });
  page.drawText("www.lalason.com", { x: 430, y: 812, font, size: 9, color: white });

  // ── Title + Invoice number ──
  const titleText = locale === "fr" ? "Facture" : "Invoice";
  page.drawText(titleText, { x: left, y, font: bold, size: 26, color: dark });

  // Invoice number on the right
  page.drawText(invoiceNumber, { x: right - bold.widthOfTextAtSize(invoiceNumber, 12), y, font: bold, size: 12, color: dark });
  y -= 10;
  page.drawRectangle({ x: left, y, width: 50, height: 3, color: accent });
  y -= 30;

  // ── Status badge ──
  const statusText = isPaid
    ? (locale === "fr" ? "PAYÉE" : "PAID")
    : (locale === "fr" ? "EN ATTENTE" : "PENDING");
  const statusColor = isPaid ? green : accent;
  const statusWidth = bold.widthOfTextAtSize(statusText, 9) + 16;
  page.drawRectangle({
    x: right - statusWidth,
    y: y - 2,
    width: statusWidth,
    height: 18,
    color: statusColor,
  });
  page.drawText(statusText, { x: right - statusWidth + 8, y: y + 2, font: bold, size: 9, color: white });

  // ── Date ──
  const dateLabel = locale === "fr" ? "Date :" : "Date:";
  page.drawText(dateLabel, { x: left, y, font, size: 10, color: gray });
  page.drawText(invoiceDate, { x: left + 80, y, font: bold, size: 10, color: dark });
  y -= 30;

  // ── Two-column: Seller / Customer ──
  const colLeft = left;
  const colRight = 320;

  // Seller
  const sellerTitle = locale === "fr" ? "Émetteur" : "From";
  page.drawText(sellerTitle, { x: colLeft, y, font: bold, size: 10, color: dark });
  y -= lineH;
  page.drawText("Lalason", { x: colLeft, y, font: bold, size: 10, color: gray });
  y -= lineH;
  page.drawText("IDE : CH-250.929.703", { x: colLeft, y, font, size: 9, color: gray });
  y -= lineH;
  page.drawText("contact@lalason.com", { x: colLeft, y, font, size: 9, color: gray });

  // Customer (same Y as seller start)
  const custY = y + lineH * 3;
  const custTitle = locale === "fr" ? "Client" : "Bill to";
  page.drawText(custTitle, { x: colRight, y: custY, font: bold, size: 10, color: dark });
  let custLine = custY - lineH;

  // Customer name (company or personal)
  page.drawText(customerName, { x: colRight, y: custLine, font: bold, size: 10, color: dark });
  custLine -= lineH;

  // Address block (each line)
  for (const line of customerAddressLines) {
    page.drawText(line, { x: colRight, y: custLine, font, size: 9, color: gray });
    custLine -= lineH;
  }

  // Email always at the bottom
  page.drawText(user.email ?? "", { x: colRight, y: custLine, font, size: 9, color: gray });

  y -= lineH + 20;

  // ── Separator ──
  page.drawRectangle({ x: left, y, width: right - left, height: 0.5, color: lightGray });
  y -= 25;

  // ── Line items table header ──
  const descCol = left;
  const periodCol = 250;
  const amountCol = right;

  page.drawText(locale === "fr" ? "Description" : "Description", { x: descCol, y, font: bold, size: 9, color: gray });
  page.drawText(locale === "fr" ? "Période" : "Period", { x: periodCol, y, font: bold, size: 9, color: gray });
  page.drawText(locale === "fr" ? "Montant" : "Amount", {
    x: amountCol - bold.widthOfTextAtSize(locale === "fr" ? "Montant" : "Amount", 9),
    y, font: bold, size: 9, color: gray,
  });
  y -= 8;
  page.drawRectangle({ x: left, y, width: right - left, height: 0.5, color: lightGray });
  y -= lineH;

  // ── Line item ──
  page.drawText(planLabel, { x: descCol, y, font, size: 10, color: dark });
  page.drawText(`${periodStart} — ${periodEnd}`, { x: periodCol, y, font, size: 10, color: gray });
  const amountText = formatAmount(subtotal, currency, locale);
  page.drawText(amountText, {
    x: amountCol - font.widthOfTextAtSize(amountText, 10),
    y, font, size: 10, color: dark,
  });
  y -= lineH + 8;
  page.drawRectangle({ x: left, y, width: right - left, height: 0.5, color: lightGray });
  y -= 20;

  // ── Totals ──
  const totalsX = 380;
  const totalsValX = right;

  // Subtotal
  const subtotalLabel = locale === "fr" ? "Sous-total HT" : "Subtotal";
  page.drawText(subtotalLabel, { x: totalsX, y, font, size: 10, color: gray });
  const subtotalText = formatAmount(subtotal, currency, locale);
  page.drawText(subtotalText, { x: totalsValX - font.widthOfTextAtSize(subtotalText, 10), y, font, size: 10, color: dark });
  y -= lineH;

  // Tax
  const taxLabel = taxRate > 0
    ? (locale === "fr" ? `TVA (${taxRate}%)` : `Tax (${taxRate}%)`)
    : (locale === "fr" ? "TVA" : "Tax");
  page.drawText(taxLabel, { x: totalsX, y, font, size: 10, color: gray });
  const taxText = formatAmount(tax, currency, locale);
  page.drawText(taxText, { x: totalsValX - font.widthOfTextAtSize(taxText, 10), y, font, size: 10, color: dark });
  y -= lineH + 5;

  // Total
  page.drawRectangle({ x: totalsX - 10, y: y - 5, width: totalsValX - totalsX + 20, height: 28, color: rgb(0.96, 0.97, 0.97), borderColor: lightGray, borderWidth: 0.5 });
  const totalLabel = "Total";
  page.drawText(totalLabel, { x: totalsX, y: y + 3, font: bold, size: 11, color: dark });
  const totalText = formatAmount(total, currency, locale);
  page.drawText(totalText, { x: totalsValX - bold.widthOfTextAtSize(totalText, 11), y: y + 3, font: bold, size: 11, color: dark });
  y -= 45;

  // ── Payment method ──
  const pmLabel = locale === "fr" ? "Mode de paiement :" : "Payment method:";
  page.drawText(pmLabel, { x: left, y, font, size: 10, color: gray });
  page.drawText(paymentMethod, { x: left + 130, y, font: bold, size: 10, color: dark });
  y -= 30;

  // ── Separator ──
  page.drawRectangle({ x: left, y, width: right - left, height: 0.5, color: lightGray });
  y -= 20;

  // ── Legal note ──
  const legalLines = locale === "fr"
    ? [
        "Lalason — Musique originale, libre de droit.",
        "En cas de question concernant cette facture, contactez-nous à contact@lalason.com.",
      ]
    : [
        "Lalason — Original royalty-free music.",
        "For any questions regarding this invoice, contact us at contact@lalason.com.",
      ];

  for (const line of legalLines) {
    page.drawText(line, { x: left, y, font, size: 8, color: gray });
    y -= 13;
  }

  // ── Footer bar ──
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 35, color: dark });
  const footerText = `Lalason · IDE : CH-250.929.703 · contact@lalason.com · www.lalason.com`;
  page.drawText(footerText, { x: left, y: 12, font, size: 8, color: white });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lalason-facture-${invoiceNumber}.pdf"`,
    },
  });
}
