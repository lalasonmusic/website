import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Données collectées</h2>
      <p>
        {"Lalason collecte les données suivantes : adresse email, informations de paiement (via Stripe, sans stockage local), Channel ID YouTube (si renseigné), historique de téléchargements."}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Finalités</h2>
      <p>{"Les données sont utilisées pour : la gestion des comptes et abonnements, l'envoi de la newsletter (avec consentement), l'analyse d'usage anonymisée (PostHog, avec opt-in)."}</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Conservation</h2>
      <p>{"Les données sont conservées pendant la durée de l'abonnement, puis 3 ans à des fins légales."}</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Vos droits</h2>
      <p>
        {"Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits : contact@lalason.com"}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Cookies</h2>
      <p>
        {"Ce site utilise des cookies strictement nécessaires au fonctionnement (session, authentification) et des cookies analytiques (PostHog) soumis à votre consentement."}
      </p>
    </LegalPage>
  );
}
