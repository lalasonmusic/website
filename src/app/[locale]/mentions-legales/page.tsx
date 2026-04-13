import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "fr" ? "Mentions légales" : "Legal notice",
  };
}

const h2Style = {
  fontWeight: 700,
  color: "var(--color-text-primary)",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

export default async function MentionsLegalesPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <LegalPage title={isFr ? "Mentions légales" : "Legal notice"}>
      <h2 style={h2Style}>{isFr ? "Éditeur du site" : "Site editor"}</h2>
      <p>Lalason</p>
      <p>Email : contact@lalason.com</p>

      <h2 style={h2Style}>{isFr ? "Hébergement" : "Hosting"}</h2>
      <p>Vercel Inc. — 340 Pine Street, Suite 1600, San Francisco, CA 94104, USA</p>

      <h2 style={h2Style}>{isFr ? "Propriété intellectuelle" : "Intellectual property"}</h2>
      <p>
        {isFr
          ? "L'ensemble des contenus présents sur le site lalason.com (musiques, textes, images, logos) sont la propriété exclusive de Lalason et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle."
          : "All content on the lalason.com website (music, text, images, logos) is the exclusive property of Lalason and is protected by French and international intellectual property laws."}
      </p>
      <p>
        {isFr
          ? "Toute reproduction, distribution ou utilisation sans autorisation préalable écrite est strictement interdite."
          : "Any reproduction, distribution or use without prior written authorization is strictly prohibited."}
      </p>
    </LegalPage>
  );
}
