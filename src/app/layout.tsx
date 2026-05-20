import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Deen's Grill | Restaurant de Grillades à Ouaga 2000, Ouagadougou",
  description:
    "Deen's Grill — Votre restaurant de grillades préféré à Ouaga 2000, Ouagadougou, Burkina Faso. Bœuf, mouton, poulet grillé au charbon, shawarma, pizzas artisanales, cocktails. Ouvert 7j/7 de 13h à 22h30/23h. Réservez au 00226 54 02 55 55.",
  keywords: [
    "Deen's Grill",
    "restaurant Ouagadougou",
    "grillades Burkina Faso",
    "Ouaga 2000",
    "restaurant grill",
    "shawarma Ouagadougou",
    "pizza Ouaga",
    "mix grill Ouagadougou",
    "mouton grillé",
    "restaurant Ouaga 2000",
  ],
  authors: [{ name: "Deen's Grill" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Deen's Grill | iid riita sonma — Restaurant de Grillades à Ouaga 2000",
    description:
      "Restaurant de grillades à Ouaga 2000, Ouagadougou. Bœuf, mouton, poulet, shawarma, pizzas. Chaque bouchée est un véritable régal! Ouvert 7j/7.",
    type: "website",
    locale: "fr_BF",
    siteName: "Deen's Grill",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ee7a12" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {children}
      </body>
    </html>
  );
}
