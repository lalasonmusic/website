import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  // Pathnames declared so the typed Link/useRouter/usePathname helpers from
  // next-intl/navigation accept all routes used in the app. Routes whose slug
  // is identical in FR and EN are declared as a string. Only routes with a
  // truly localised slug (musique-ambiance ↔ ambient-music) get an object.
  pathnames: {
    "/": "/",
    "/abonnement/annule": "/abonnement/annule",
    "/abonnement/succes": "/abonnement/succes",
    "/abonnements": "/abonnements",
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/catalogue": "/catalogue",
    "/cgu": "/cgu",
    "/cgv": "/cgv",
    "/comparateur": "/comparateur",
    "/connexion": "/connexion",
    "/contact": "/contact",
    "/faq": "/faq",
    "/inscription": "/inscription",
    "/membre": "/membre",
    "/membre/favoris": "/membre/favoris",
    "/membre/nouveau-mot-de-passe": "/membre/nouveau-mot-de-passe",
    "/mentions-legales": "/mentions-legales",
    "/mot-de-passe-oublie": "/mot-de-passe-oublie",
    "/nos-artistes": "/nos-artistes",
    "/nos-artistes/[slug]": "/nos-artistes/[slug]",
    "/politique-de-confidentialite": "/politique-de-confidentialite",
    "/musique-ambiance": {
      fr: "/musique-ambiance",
      en: "/ambient-music",
    },
    "/musique-ambiance/[slug]": {
      fr: "/musique-ambiance/[slug]",
      en: "/ambient-music/[slug]",
    },
  },
});
