import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Contact" : "Contact",
    description:
      locale === "fr"
        ? "Contactez l'équipe Lalason pour toute question sur notre catalogue de musique libre de droits."
        : "Contact the Lalason team with any questions about our royalty-free music catalogue.",
    locale,
    pagePath: "/contact",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
