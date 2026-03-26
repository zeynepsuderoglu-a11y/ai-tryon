import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import JsonLd from "@/components/JsonLd";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.studyoima.com"),
  title: {
    default: "StudyoİMA AI — Yapay Zeka Kıyafet, Gözlük & Video Üretimi",
    template: "%s | StudyoİMA AI",
  },
  description:
    "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli oluşturun. Yapay zeka destekli kıyafet try-on, gözlük try-on ve video üretimi. E-ticaret kataloğunuzu hızlandırın.",
  keywords: [
    "yapay zeka kıyafet",
    "ai kıyafet deneme",
    "sanal kıyafet deneme",
    "AI manken görseli",
    "e-ticaret ürün fotoğrafı",
    "kıyafet görselleştirme",
    "sanal gözlük deneme",
    "ai gözlük try-on",
    "yapay zeka katalog",
    "studyoima ai",
    "studyoima",
    "ai video üretimi",
  ],
  authors: [{ name: "StudyoİMA AI", url: "https://www.studyoima.com" }],
  creator: "StudyoİMA AI",
  publisher: "StudyoİMA AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.studyoima.com",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.studyoima.com",
    siteName: "StudyoİMA AI",
    title: "StudyoİMA AI — Yapay Zeka Kıyafet, Gözlük & Video Üretimi",
    description:
      "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli oluşturun. Yapay zeka destekli kıyafet try-on, gözlük deneme ve video üretimi.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "StudyoİMA AI — Yapay Zeka Görsel Üretim Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyoİMA AI — Yapay Zeka Kıyafet, Gözlük & Video Üretimi",
    description:
      "Ürün fotoğrafından saniyeler içinde profesyonel manken görseli oluşturun.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" translate="no">
      <body className={inter.className} suppressHydrationWarning>
        <JsonLd />
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
