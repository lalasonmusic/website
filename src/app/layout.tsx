import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={poppins.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
