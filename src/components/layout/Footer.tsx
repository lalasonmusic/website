import { getTranslations } from "next-intl/server";
import NewsletterForm from "./NewsletterForm";

type Props = {
  locale: string;
};

export default async function Footer({ locale }: Props) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  const legalLinks = [
    { href: `/${locale}/mentions-legales`, label: t("legal") },
    { href: `/${locale}/politique-de-confidentialite`, label: t("privacy") },
    { href: `/${locale}/cgv`, label: t("cgv") },
    { href: `/${locale}/cgu`, label: t("cgu") },
  ];

  return (
    <footer style={{
      backgroundColor: "var(--color-bg-secondary)",
      borderTop: "1px solid var(--color-border)",
      padding: "3rem 1.5rem 2rem",
      marginBottom: "var(--player-height-desktop)",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Top row */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2rem",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}>
          {/* Brand */}
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.5rem" }}>Lalason</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: "240px" }}>
              Musique libre de droit originale pour vos projets créatifs.
            </p>
          </div>

          {/* Legal links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {legalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Newsletter */}
          <div style={{ minWidth: "240px" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem" }}>
              {t("newsletter")}
            </p>
            <NewsletterForm
              placeholder={t("newsletterPlaceholder")}
              buttonLabel={t("newsletterButton")}
              successMessage={t("newsletterSuccess")}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          textAlign: "center",
        }}>
          {t("rights", { year })}
        </div>
      </div>
    </footer>
  );
}
