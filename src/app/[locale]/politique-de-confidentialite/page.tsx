import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "fr" ? "Politique de confidentialité" : "Privacy policy",
  };
}

const h2Style = {
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

export default async function PolitiqueConfidentialitePage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <LegalPage
      title={isFr ? "Politique de confidentialité" : "Privacy policy"}
    >
      <h2 style={h2Style}>{isFr ? "Données collectées" : "Data collected"}</h2>
      <p>
        {isFr
          ? "Lalason collecte les données suivantes : adresse email, informations de paiement (via Stripe, sans stockage local), Channel ID YouTube (si renseigné), historique de téléchargements."
          : "Lalason collects the following data: email address, payment information (via Stripe, with no local storage), YouTube Channel ID (if provided), download history."}
      </p>

      <h2 style={h2Style}>{isFr ? "Finalités" : "Purposes"}</h2>
      <p>
        {isFr
          ? "Les données sont utilisées pour : la gestion des comptes et abonnements, l'envoi de la newsletter (avec consentement), l'analyse d'usage anonymisée (PostHog, avec opt-in)."
          : "Data is used for: account and subscription management, newsletter delivery (with consent), anonymized usage analytics (PostHog, opt-in)."}
      </p>

      <h2 style={h2Style}>{isFr ? "Conservation" : "Retention"}</h2>
      <p>
        {isFr
          ? "Les données sont conservées pendant la durée de l'abonnement, puis 3 ans à des fins légales."
          : "Data is kept for the duration of the subscription, then for 3 years for legal purposes."}
      </p>

      <h2 style={h2Style}>{isFr ? "Vos droits" : "Your rights"}</h2>
      <p>
        {isFr
          ? "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits : contact@lalason.com"
          : "In accordance with GDPR, you have the right to access, rectify, delete and port your data. To exercise these rights: contact@lalason.com"}
      </p>

      <h2 style={h2Style}>{isFr ? "Cookies" : "Cookies"}</h2>
      <p>
        {isFr
          ? "Ce site utilise des cookies strictement nécessaires au fonctionnement (session, authentification) et des cookies analytiques (PostHog) soumis à votre consentement."
          : "This site uses cookies strictly necessary for operation (session, authentication) and analytics cookies (PostHog) subject to your consent."}
      </p>
    </LegalPage>
  );
}
