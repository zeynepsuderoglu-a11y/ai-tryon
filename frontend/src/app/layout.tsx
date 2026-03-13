import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "İMA Tryon — Yapay Zeka Kıyafet Giydirme",
  description: "Profesyonel stüdyo kalitesinde yapay zeka kıyafet görselleştirme. İMA Tryon ile ürünlerinizi saniyeler içinde manken üzerinde görün.",
  keywords: ["yapay zeka kıyafet", "sanal deneme", "AI moda", "e-ticaret görsel", "ima tryon"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" translate="no">
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
