import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "fr"
        ? "Conditions générales d'utilisation"
        : "Terms of use",
  };
}

const h2Style = {
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

export default async function CguPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <LegalPage
      title={isFr ? "Conditions Générales d'Utilisation" : "Terms of Use"}
    >
      <h2 style={h2Style}>{isFr ? "Accès au service" : "Service access"}</h2>
      <p>
        {isFr
          ? "Lalason est accessible à toute personne disposant d'un accès internet. La création d'un compte est nécessaire pour télécharger les morceaux."
          : "Lalason is accessible to anyone with an internet connection. Creating an account is required to download tracks."}
      </p>

      <h2 style={h2Style}>{isFr ? "Utilisation autorisée" : "Authorized use"}</h2>
      <p>
        {isFr
          ? "Les morceaux téléchargés peuvent être utilisés dans le cadre défini par votre abonnement (créateur ou boutique). Toute revente, distribution ou sous-licence est interdite."
          : "Downloaded tracks may be used within the scope defined by your subscription (creator or boutique). Any resale, distribution or sublicensing is prohibited."}
      </p>

      <h2 style={h2Style}>{isFr ? "Compte utilisateur" : "User account"}</h2>
      <p>
        {isFr
          ? "Vous êtes responsable de la confidentialité de vos identifiants. Tout usage non autorisé de votre compte doit être signalé immédiatement à contact@lalason.com"
          : "You are responsible for the confidentiality of your credentials. Any unauthorized use of your account must be reported immediately to contact@lalason.com"}
      </p>

      <h2 style={h2Style}>
        {isFr ? "Limitation de responsabilité" : "Limitation of liability"}
      </h2>
      <p>
        {isFr
          ? "Lalason ne saurait être tenu responsable des interruptions de service, pertes de données ou dommages indirects liés à l'utilisation du site."
          : "Lalason cannot be held liable for service interruptions, data loss or indirect damages related to the use of the website."}
      </p>

      <h2 style={h2Style}>{isFr ? "Droit applicable" : "Governing law"}</h2>
      <p>
        {isFr
          ? "Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents de Paris."
          : "These Terms of Use are governed by French law. Any dispute will be brought before the competent courts of Paris."}
      </p>
    </LegalPage>
  );
}
