import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function CgvPage() {
  return (
    <LegalPage title="Conditions Générales de Vente">
      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Objet</h2>
      <p>
        {"Les présentes CGV régissent les conditions de souscription aux abonnements Lalason donnant accès au catalogue de musiques libres de droit."}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Offres</h2>
      <p><strong>Créateurs Mensuel</strong>{" : 15,99 € / mois — licence YouTube, Instagram, podcasts, publicités."}</p>
      <p><strong>Créateurs Annuel</strong>{" : 99,99 € / an — mêmes droits, facturation annuelle."}</p>
      <p><strong>Boutique Annuel</strong>{" : 99,99 € / an — diffusion en lieu public (commerces, restaurants, hôtels)."}</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Paiement</h2>
      <p>{"Le paiement est traité par Stripe (carte bancaire). La souscription est renouvelée automatiquement sauf résiliation."}</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Résiliation</h2>
      <p>{"Vous pouvez résilier à tout moment depuis votre espace membre. L'accès reste actif jusqu'à la fin de la période en cours."}</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Droit de rétractation</h2>
      <p>
        {"Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques dont l'exécution a commencé avec votre accord."}
      </p>
    </LegalPage>
  );
}
