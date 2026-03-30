import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <LegalPage title="Conditions Générales d'Utilisation">
      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Accès au service</h2>
      <p>
        {"Lalason est accessible à toute personne disposant d'un accès internet. La création d'un compte est nécessaire pour télécharger les morceaux."}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Utilisation autorisée</h2>
      <p>
        {"Les morceaux téléchargés peuvent être utilisés dans le cadre défini par votre abonnement (créateur ou boutique). Toute revente, distribution ou sous-licence est interdite."}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Compte utilisateur</h2>
      <p>
        {"Vous êtes responsable de la confidentialité de vos identifiants. Tout usage non autorisé de votre compte doit être signalé immédiatement à contact@lalason.com"}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Limitation de responsabilité</h2>
      <p>
        {"Lalason ne saurait être tenu responsable des interruptions de service, pertes de données ou dommages indirects liés à l'utilisation du site."}
      </p>

      <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Droit applicable</h2>
      <p>{"Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Paris."}</p>
    </LegalPage>
  );
}
