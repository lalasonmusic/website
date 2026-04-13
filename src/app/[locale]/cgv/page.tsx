import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "fr"
        ? "Conditions générales de vente"
        : "Terms of sale",
  };
}

const h2Style = {
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

export default async function CgvPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <LegalPage
      title={isFr ? "Conditions Générales de Vente" : "Terms of Sale"}
    >
      <h2 style={h2Style}>{isFr ? "Objet" : "Purpose"}</h2>
      <p>
        {isFr
          ? "Les présentes CGV régissent les conditions de souscription aux abonnements Lalason donnant accès au catalogue de musiques libres de droit."
          : "These Terms of Sale govern the subscription conditions for Lalason plans providing access to the royalty-free music catalogue."}
      </p>

      <h2 style={h2Style}>{isFr ? "Offres" : "Plans"}</h2>
      <p>
        <strong>{isFr ? "Créateurs Mensuel" : "Creators Monthly"}</strong>
        {isFr
          ? " : 15,99 € / mois — licence YouTube, Instagram, podcasts, publicités."
          : ": €15.99 / month — licence for YouTube, Instagram, podcasts, advertising."}
      </p>
      <p>
        <strong>{isFr ? "Créateurs Annuel" : "Creators Annual"}</strong>
        {isFr
          ? " : 99,99 € / an — mêmes droits, facturation annuelle."
          : ": €99.99 / year — same rights, annual billing."}
      </p>
      <p>
        <strong>{isFr ? "Boutique Annuel" : "Boutique Annual"}</strong>
        {isFr
          ? " : 99,99 € / an — diffusion en lieu public (commerces, restaurants, hôtels)."
          : ": €99.99 / year — broadcasting in public places (shops, restaurants, hotels)."}
      </p>

      <h2 style={h2Style}>{isFr ? "Paiement" : "Payment"}</h2>
      <p>
        {isFr
          ? "Le paiement est traité par Stripe (carte bancaire, PayPal). La souscription est renouvelée automatiquement sauf résiliation."
          : "Payment is processed by Stripe (credit card, PayPal). The subscription is renewed automatically unless cancelled."}
      </p>

      <h2 style={h2Style}>{isFr ? "Résiliation" : "Cancellation"}</h2>
      <p>
        {isFr
          ? "Vous pouvez résilier à tout moment depuis votre espace membre. L'accès reste actif jusqu'à la fin de la période en cours."
          : "You may cancel at any time from your member area. Access remains active until the end of the current period."}
      </p>

      <h2 style={h2Style}>
        {isFr ? "Droit de rétractation" : "Right of withdrawal"}
      </h2>
      <p>
        {isFr
          ? "Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques dont l'exécution a commencé avec votre accord."
          : "In accordance with Article L221-28 of the French Consumer Code, the right of withdrawal does not apply to digital content whose execution has started with your consent."}
      </p>
    </LegalPage>
  );
}
