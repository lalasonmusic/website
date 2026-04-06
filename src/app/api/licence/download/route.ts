import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function generateLicenseNumber(subscriptionId: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const shortId = subscriptionId.substring(0, 8).toUpperCase();
  return `LIC-${year}${month}-${shortId}`;
}

const planDescriptions: Record<string, { fr: string; en: string }> = {
  creators_monthly: { fr: "Créateurs — Mensuel", en: "Creators — Monthly" },
  creators_annual: { fr: "Créateurs — Annuel", en: "Creators — Annual" },
  boutique_annual: { fr: "Boutique — Annuel", en: "Boutique — Annual" },
};

const creatorUsages = {
  fr: [
    "Vidéos YouTube (monétisation autorisée)",
    "Stories et Reels Instagram / TikTok",
    "Podcasts (Spotify, Apple Podcasts, etc.)",
    "Publicités en ligne",
    "Tout contenu créatif numérique",
  ],
  en: [
    "YouTube videos (monetisation authorised)",
    "Instagram / TikTok Stories and Reels",
    "Podcasts (Spotify, Apple Podcasts, etc.)",
    "Online advertising",
    "Any digital creative content",
  ],
};

const boutiqueUsages = {
  fr: [
    "Diffusion en lieu public (commerces, restaurants, hôtels)",
    "Ambiance sonore en boutique",
    "Espaces recevant du public",
  ],
  en: [
    "Public broadcast (shops, restaurants, hotels)",
    "In-store background music",
    "Public-facing venues",
  ],
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";

  const [activeSub] = await db
    .select({
      id: subscriptions.id,
      planType: subscriptions.planType,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!activeSub) {
    return new Response("No active subscription", { status: 403 });
  }

  const licenseNumber = generateLicenseNumber(activeSub.id, activeSub.createdAt);
  const planLabel = planDescriptions[activeSub.planType]?.[locale] ?? activeSub.planType;
  const isBoutique = activeSub.planType === "boutique_annual";
  const usages = isBoutique ? boutiqueUsages[locale] : creatorUsages[locale];

  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const startDate = activeSub.createdAt.toLocaleDateString(dateLocale, dateOpts);
  const endDate = activeSub.currentPeriodEnd.toLocaleDateString(dateLocale, dateOpts);

  // ── Build PDF ──
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.106, 0.227, 0.294); // #1b3a4b
  const accent = rgb(0.961, 0.651, 0.137); // #f5a623
  const gray = rgb(0.45, 0.49, 0.52);
  const lightGray = rgb(0.85, 0.87, 0.88);

  let y = 780;
  const left = 50;
  const lineH = 18;

  // Header bar
  page.drawRectangle({ x: 0, y: 800, width: 595, height: 42, color: dark });
  page.drawText("LALASON", { x: left, y: 812, font: bold, size: 16, color: rgb(1, 1, 1) });
  page.drawText("www.lalason.com", { x: 430, y: 812, font, size: 9, color: rgb(1, 1, 1) });

  // Title
  const title = locale === "fr" ? "Certificat de Licence" : "Licence Certificate";
  page.drawText(title, { x: left, y, font: bold, size: 24, color: dark });
  y -= 10;

  // Accent line
  page.drawRectangle({ x: left, y, width: 60, height: 3, color: accent });
  y -= 30;

  // License number box
  page.drawRectangle({ x: left, y: y - 5, width: 495, height: 40, color: rgb(0.96, 0.97, 0.97), borderColor: lightGray, borderWidth: 1 });
  const numLabel = locale === "fr" ? "N° de licence :" : "Licence number:";
  page.drawText(numLabel, { x: left + 15, y: y + 10, font, size: 10, color: gray });
  page.drawText(licenseNumber, { x: left + 130, y: y + 10, font: bold, size: 14, color: dark });
  y -= 50;

  // Holder name from user metadata
  const licenceFirstName = (user.user_metadata?.licence_first_name as string) ?? "";
  const licenceLastName = (user.user_metadata?.licence_last_name as string) ?? "";
  const licenceAddress = (user.user_metadata?.licence_address as string) ?? "";
  const holderName = [licenceFirstName, licenceLastName].filter(Boolean).join(" ") || (user.email ?? "—");

  // Info section
  const infoItems = [
    [locale === "fr" ? "Titulaire" : "Holder", holderName],
    ...(licenceAddress ? [[locale === "fr" ? "Adresse" : "Address", licenceAddress]] : []),
    [locale === "fr" ? "Email" : "Email", user.email ?? "—"],
    [locale === "fr" ? "Formule" : "Plan", planLabel],
    [locale === "fr" ? "Valide du" : "Valid from", startDate],
    [locale === "fr" ? "Au" : "Until", endDate],
  ];

  for (const [label, value] of infoItems) {
    page.drawText(label, { x: left, y, font, size: 10, color: gray });
    page.drawText(value, { x: left + 120, y, font: bold, size: 10, color: dark });
    y -= lineH;
  }
  y -= 15;

  // Separator
  page.drawRectangle({ x: left, y: y + 5, width: 495, height: 0.5, color: lightGray });
  y -= 15;

  // Authorized uses
  const usagesTitle = locale === "fr" ? "Usages autorisés" : "Authorised uses";
  page.drawText(usagesTitle, { x: left, y, font: bold, size: 13, color: dark });
  y -= 25;

  for (const usage of usages) {
    page.drawText("•", { x: left + 5, y, font: bold, size: 10, color: accent });
    page.drawText(usage, { x: left + 20, y, font, size: 10, color: dark });
    y -= lineH;
  }
  y -= 15;

  // Separator
  page.drawRectangle({ x: left, y: y + 5, width: 495, height: 0.5, color: lightGray });
  y -= 15;

  // Legal note
  const noteTitle = locale === "fr" ? "Important" : "Important";
  page.drawText(noteTitle, { x: left, y, font: bold, size: 11, color: dark });
  y -= lineH;

  const noteLines =
    locale === "fr"
      ? [
          "Ce certificat atteste que le titulaire dispose d'une licence valide pour utiliser",
          "les morceaux du catalogue Lalason dans le cadre des usages listés ci-dessus.",
          "",
          "En cas de réclamation Content ID ou de demande de preuve de licence,",
          "communiquez ce numéro de licence à la plateforme concernée.",
          "",
          "Cette licence est valide uniquement pendant la durée de l'abonnement actif.",
          "Les contenus créés pendant la période de validité restent couverts.",
        ]
      : [
          "This certificate attests that the holder has a valid licence to use tracks",
          "from the Lalason catalogue for the uses listed above.",
          "",
          "In case of a Content ID claim or licence proof request,",
          "share this licence number with the relevant platform.",
          "",
          "This licence is valid only during the active subscription period.",
          "Content created during the validity period remains covered.",
        ];

  for (const line of noteLines) {
    if (line) {
      page.drawText(line, { x: left, y, font, size: 9, color: gray });
    }
    y -= 14;
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 35, color: dark });
  const footerText =
    locale === "fr"
      ? `Document généré le ${new Date().toLocaleDateString(dateLocale, dateOpts)} — Lalason`
      : `Document generated on ${new Date().toLocaleDateString(dateLocale, dateOpts)} — Lalason`;
  page.drawText(footerText, { x: left, y: 12, font, size: 8, color: rgb(1, 1, 1) });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lalason-licence-${licenseNumber}.pdf"`,
    },
  });
}
