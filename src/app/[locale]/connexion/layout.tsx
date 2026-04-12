import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Connexion" : "Login",
    description:
      locale === "fr"
        ? "Connectez-vous à votre espace membre Lalason pour accéder au catalogue de musique libre de droits."
        : "Log in to your Lalason member area to access the royalty-free music catalogue.",
    locale,
    pagePath: "/connexion",
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
