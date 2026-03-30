import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales">
      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Éditeur du site</h2>
      <p>Lalason — [Nom de la société / Statut juridique à compléter]</p>
      <p>Adresse : [À compléter]</p>
      <p>Email : contact@lalason.com</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Hébergement</h2>
      <p>Vercel Inc. — 340 Pine Street, Suite 1600, San Francisco, CA 94104, USA</p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Propriété intellectuelle</h2>
      <p>
        {"L'ensemble des contenus présents sur le site lalason.com (musiques, textes, images, logos) sont la propriété exclusive de Lalason et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle."}
      </p>
      <p>
        {"Toute reproduction, distribution ou utilisation sans autorisation préalable écrite est strictement interdite."}
      </p>
    </LegalPage>
  );
}
