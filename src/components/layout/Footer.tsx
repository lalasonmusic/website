import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export default async function Footer({ locale }: Props) {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  const isFr = locale === "fr";

  const catalogueLinks = [
    { href: `/${locale}/catalogue?style=`, label: isFr ? "Par style" : "By style" },
    { href: `/${locale}/catalogue?theme=`, label: isFr ? "Par thème" : "By theme" },
    { href: `/${locale}/catalogue?mood=`, label: isFr ? "Par humeur" : "By mood" },
  ];

  const siteLinks = [
    { href: `/${locale}`, label: isFr ? "Accueil" : "Home" },
    { href: `/${locale}/blog`, label: isFr ? "Actus" : "News" },
    { href: `/${locale}/nos-artistes`, label: isFr ? "Nos artistes" : "Our artists" },
    { href: `/${locale}/abonnements`, label: isFr ? "Abonnements" : "Pricing" },
    { href: `/${locale}/politique-de-confidentialite`, label: t("privacy") },
    { href: `/${locale}/mentions-legales`, label: t("legal") },
    { href: `/${locale}/comparateur`, label: isFr ? "Comparateur" : "Comparison" },
  ];

  return (
    <footer style={{
      backgroundColor: "var(--color-bg-secondary)",
      borderTop: "1px solid var(--color-border)",
      padding: "3rem 1.5rem 2rem",
      marginBottom: "var(--player-height-desktop)",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}>
          {/* Brand */}
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              lalason
            </p>
            <p style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              maxWidth: "220px",
              lineHeight: 1.6,
            }}>
              {isFr
                ? "la musique libre"
                : "royalty-free music"}
            </p>
          </div>

          {/* Catalogue links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {catalogueLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Site links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {siteLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social icons */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@LaMusiqueLibre"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            {/* SoundCloud */}
            <a
              href="https://soundcloud.com/lalasonmusic"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SoundCloud"
              style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.236-1.282-.236-1.332c-.014-.057-.047-.094-.104-.094m1.8-1.18c-.066 0-.12.055-.12.116l-.213 2.49.213 2.414c0 .064.054.116.12.116.063 0 .114-.052.12-.116l.24-2.414-.24-2.49c-.006-.061-.057-.116-.12-.116m.824-.553c-.069 0-.133.06-.133.127l-.2 3.043.2 2.907c0 .07.064.127.133.127.066 0 .12-.057.127-.127l.24-2.907-.24-3.043c-.007-.067-.06-.127-.127-.127m.838-.446c-.084 0-.15.074-.15.15l-.184 3.489.184 3.193c0 .08.066.15.15.15.078 0 .15-.07.15-.15l.208-3.193-.208-3.489c0-.076-.072-.15-.15-.15m.89-.386c-.09 0-.168.08-.168.166l-.167 3.875.167 3.375c0 .09.078.166.168.166.084 0 .162-.077.168-.166l.19-3.375-.19-3.875c-.006-.086-.084-.166-.168-.166m.964-.256c-.104 0-.186.09-.19.186l-.15 4.131.15 3.545c.004.1.086.186.19.186.097 0 .18-.086.186-.186l.174-3.545-.174-4.131c-.006-.096-.09-.186-.186-.186m.967-.15c-.11 0-.2.098-.2.204l-.138 4.281.138 3.636c0 .11.09.2.2.2.104 0 .194-.09.2-.2l.154-3.636-.154-4.28c-.006-.107-.096-.205-.2-.205m1.033-.08c-.12 0-.217.104-.22.22l-.122 4.36.122 3.69c.003.12.1.22.22.22.114 0 .21-.1.22-.22l.135-3.69-.135-4.36c-.01-.116-.106-.22-.22-.22m1.046.008c-.135 0-.24.116-.24.24l-.105 4.112.105 3.727c0 .127.105.24.24.24.126 0 .232-.113.24-.24l.12-3.727-.12-4.112c-.008-.124-.114-.24-.24-.24m1.137.276c-.03-.15-.15-.256-.293-.256-.138 0-.258.106-.288.256l-.097 3.836.097 3.744c.03.15.15.256.288.256.142 0 .263-.106.293-.256l.104-3.744-.104-3.836m.882-.44a.327.327 0 0 0-.32-.28.327.327 0 0 0-.32.28l-.08 4.276.08 3.744a.327.327 0 0 0 .32.28.33.33 0 0 0 .32-.28l.09-3.744-.09-4.276m1.02-.457c-.02-.18-.168-.313-.348-.313-.176 0-.325.133-.348.313l-.065 4.733.065 3.78c.023.18.172.313.348.313.176 0 .328-.133.348-.313l.075-3.78-.075-4.733m.957-.278c-.01-.19-.174-.34-.365-.34-.19 0-.354.15-.365.34l-.06 5.01.06 3.81c.01.19.175.34.365.34.19 0 .355-.15.365-.34l.065-3.81-.065-5.01m1.042.066a.39.39 0 0 0-.387-.36.39.39 0 0 0-.387.36l-.044 4.944.044 3.855a.39.39 0 0 0 .387.36.39.39 0 0 0 .387-.36l.05-3.855-.05-4.944m1.125-.11c-.01-.21-.19-.38-.403-.38s-.394.17-.404.38l-.036 5.054.036 3.867c.01.21.19.38.404.38s.393-.17.403-.38l.043-3.867-.043-5.054m.924.244c0-.22-.19-.4-.417-.4-.22 0-.41.18-.417.4l-.03 4.81.03 3.89c.007.22.197.4.417.4.227 0 .417-.18.417-.4l.03-3.89-.03-4.81m1.782 1.143c-.21 0-2.673-.253-2.673-.253l-.027 3.67.027 3.907s2.463 0 2.673 0C22.607 17.7 24 16.183 24 14.32c0-1.862-1.393-3.38-3.106-3.38"/>
              </svg>
            </a>
            {/* Spotify */}
            <a
              href="https://open.spotify.com/artist/lalason"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Spotify"
              style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
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
