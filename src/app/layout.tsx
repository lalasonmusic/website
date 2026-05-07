import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://lalason.com"),
  title: {
    default: "Lalason — Musique libre de droit originale",
    template: "%s | Lalason",
  },
  description:
    "Catalogue de musique libre de droit originale pour vos vidéos, podcasts, publicités et projets créatifs.",
  // TODO: generate favicon set via favicon.io and add to /public, then wire here:
  //   icons: { icon: [...], apple: "..." }, manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0f2533",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `getLocale()` resolves the active locale from the request context
  // (next-intl middleware → URL/cookie). Falls back to `defaultLocale` for
  // routes that are outside the locale matcher (admin, /coming-soon, etc.).
  const locale = await getLocale();
  return (
    <html lang={locale} className={poppins.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
