import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

type Props = {
  locale: string;
};

export default async function Header({ locale }: Props) {
  const t = await getTranslations("nav");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const navLinks = [
    { href: `/${locale}/catalogue`, label: t("catalogue") },
    { href: `/${locale}/blog`, label: t("blog") },
    { href: `/${locale}/nos-artistes`, label: t("artists") },
    { href: `/${locale}/abonnements`, label: t("pricing") },
  ];

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backgroundColor: "rgba(15, 37, 51, 0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      height: "60px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <a
          href={`/${locale}`}
          style={{
            fontFamily: "var(--font-poppins)",
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "var(--color-text-primary)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Lalason
        </a>

        {/* Desktop nav */}
        <nav
          style={{ display: "flex", alignItems: "center", gap: "2rem" }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side: lang switcher + auth button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="desktop-nav">
          <LanguageSwitcher />
          <a
            href={user ? `/${locale}/membre` : `/${locale}/connexion`}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "0.875rem",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {user ? t("member") : t("login")}
          </a>
        </div>

        {/* Mobile burger */}
        <div className="mobile-nav">
          <MobileMenu locale={locale} isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
