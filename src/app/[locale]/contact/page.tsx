import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import ContactForm from "@/components/contact/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return buildMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
    locale,
    pagePath: "/contact",
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("contact");

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.75rem)", marginBottom: "0.75rem" }}>
        {t("pageTitle")}
      </h1>
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "1.0625rem",
          marginBottom: "2.5rem",
        }}
      >
        {t("pageDescription")}
      </p>

      <ContactForm />
    </div>
  );
}
