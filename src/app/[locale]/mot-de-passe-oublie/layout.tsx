import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Mot de passe oublié" : "Forgot password",
    description:
      locale === "fr"
        ? "Réinitialisez votre mot de passe Lalason."
        : "Reset your Lalason password.",
    locale,
    pagePath: "/mot-de-passe-oublie",
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
