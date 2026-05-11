import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "StudyoİMA AI hakkında bilgi edinin. Türkiye'nin yapay zeka destekli kıyafet, ghost manken, gözlük, arka plan değiştirme ve video üretim platformu.",
  alternates: { canonical: "https://www.studyoima.com/hakkimizda" },
  openGraph: {
    title: "Hakkımızda | StudyoİMA AI",
    description:
      "StudyoİMA AI hakkında bilgi edinin. Yapay zeka destekli kıyafet, ghost manken, gözlük, arka plan değiştirme ve video üretim platformu.",
    url: "https://www.studyoima.com/hakkimizda",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "StudyoİMA AI Hakkımızda" }],
  },
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="IMA AI Studio" width={30} height={30} className="rounded-full" />
            <span className="text-base font-semibold tracking-tight">StudyoİMA AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors">Giriş Yap</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">Ücretsiz Başla</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1a1a1a] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight mb-2">Hakkımızda</h1>
          <p className="text-sm text-[#a3a3a3] mb-10">StudyoİMA AI — Yapay Zeka Görsel Üretim Platformu</p>

          <div className="space-y-8 text-sm text-[#444] leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Biz Kimiz?</h2>
              <p>
                StudyoİMA AI, butik ve e-ticaret firmalarına yönelik yapay zeka destekli görsel üretim platformudur.
                Amacımız, pahalı ve zaman alıcı katalog çekimlerini ortadan kaldırarak markalara hızlı, ölçeklenebilir
                ve profesyonel ürün görseli üretme imkânı sunmaktır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Ne Yapıyoruz?</h2>
              <p className="mb-3">
                Platformumuz beş temel çözüm sunar:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Kıyafet:</strong> Ürün fotoğrafından yapay zeka ile
                    profesyonel manken görseli oluşturma. Düz ürün fotoğrafı veya herhangi bir açıdan
                    çekilmiş görsellerden çalışır.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Ghost Manken:</strong> Kıyafet ürün fotoğrafından
                    profesyonel ghost mannequin görseli oluşturma. Askıdaki, modeldeki veya düz zemindeki
                    kıyafeti tek tıkla e-ticaret standardına taşır.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Gözlük:</strong> Gözlük ürün fotoğrafından manken
                    üzerinde gerçekçi gözlük görseli oluşturma. Yüz tespiti ve AI gerçekçilik katmanı
                    ile çerçeve doğal görünümde yüze yapıştırılır.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Arka Plan Değiştirme:</strong> Herhangi bir fotoğrafın
                    arka planını değiştirme. 21 hazır arka plan seçeneği veya kendi görseliniz ile kişi,
                    kıyafet ve aksesuar korunarak profesyonel sahne oluşturma.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Video Üretimi:</strong> Oluşturulan manken görsellerinden
                    yapay zeka ile kısa tanıtım videosu üretme. Tek bir fotoğraftan hareket, poz ve sahne
                    içeren dinamik video içerikleri dakikalar içinde hazır olur.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Misyonumuz</h2>
              <p>
                Küçük ve orta ölçekli markaların büyük markaların görsel kalitesine erişebilmesini sağlamak.
                Geleneksel katalog çekiminin maliyeti ve lojistiği olmadan, dakikalar içinde yüzlerce ürün görseli
                üretebilen bir platform oluşturmak.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Teknoloji</h2>
              <p>
                Platformumuz, görsel kalitesi ve işlem hızı için sektörün önde gelen yapay zeka altyapılarını kullanmaktadır.
                Kıyafet giydirme, ghost mannequin dönüşümü, yüz tespiti ve video üretimi için özel olarak optimize edilmiş
                modeller bir arada çalışarak profesyonel e-ticaret standartlarında çıktı üretir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">İletişim</h2>
              <p>
                Sorularınız, önerileriniz veya iş birliği talepleriniz için bizimle iletişime geçebilirsiniz.
              </p>
              <div className="mt-3 p-4 bg-white border border-[#e5e5e5] rounded-xl space-y-1">
                <p><strong className="text-[#1a1a1a]">E-posta:</strong> <a href="mailto:ilgi@ilet.in" className="hover:text-[#c9a96e] transition-colors">ilgi@ilet.in</a></p>
                <p><strong className="text-[#1a1a1a]">Web:</strong> www.studyoima.com</p>
                <p><strong className="text-[#1a1a1a]">Adres:</strong> Merkez Mh. Merter Sk. No:42/1 Güngören / İSTANBUL</p>
                <p><strong className="text-[#1a1a1a]">Instagram:</strong> <a href="https://www.instagram.com/studyoimaai/" target="_blank" rel="noopener noreferrer" className="hover:text-[#c9a96e] transition-colors">@studyoimaai</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
