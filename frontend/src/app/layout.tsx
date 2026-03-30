import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import JsonLd from "@/components/JsonLd";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://studyoima.com"),
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
  authors: [{ name: "StudyoİMA AI", url: "https://studyoima.com" }],
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
    canonical: "https://studyoima.com",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://studyoima.com",
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
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KGCW2XC4');`}
        </Script>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TNXS8FWMTR"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TNXS8FWMTR');
          `}
        </Script>
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KGCW2XC4"
            height="0" width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <JsonLd />
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
