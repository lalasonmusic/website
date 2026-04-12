import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Inscription" : "Sign up",
    description:
      locale === "fr"
        ? "Créez votre compte Lalason pour accéder au catalogue de musique libre de droits."
        : "Create your Lalason account to access the royalty-free music catalogue.",
    locale,
    pagePath: "/inscription",
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
