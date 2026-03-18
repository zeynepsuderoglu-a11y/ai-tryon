import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Facebook } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda — İMA Tryon",
  description: "İMA Tryon hakkında bilgi edinin. Yapay zeka destekli kıyafet ve gözlük görselleştirme platformu.",
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="IMA AI Studio" width={30} height={30} className="rounded-full" />
            <span className="text-base font-semibold tracking-tight">İMA Tryon</span>
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
          <p className="text-sm text-[#a3a3a3] mb-10">İMA Tryon — Yapay Zeka Görsel Üretim Platformu</p>

          <div className="space-y-8 text-sm text-[#444] leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Biz Kimiz?</h2>
              <p>
                İMA Tryon, butik ve e-ticaret firmalarına yönelik yapay zeka destekli görsel üretim platformudur.
                Amacımız, pahalı ve zaman alıcı katalog çekimlerini ortadan kaldırarak markalara hızlı, ölçeklenebilir
                ve profesyonel ürün görseli üretme imkânı sunmaktır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Ne Yapıyoruz?</h2>
              <p className="mb-3">
                Platformumuz iki temel çözüm sunar:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Kıyafet Try-On:</strong> Ürün fotoğrafından yapay zeka ile
                    profesyonel manken görseli oluşturma. Ghost mannequin, düz ürün fotoğrafı veya herhangi bir açıdan
                    çekilmiş görsellerden çalışır.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span>
                    <strong className="text-[#1a1a1a]">Gözlük Try-On:</strong> Gözlük ürün fotoğrafından manken
                    üzerinde gerçekçi gözlük görseli oluşturma. MediaPipe yüz tespiti ve AI gerçekçilik katmanı
                    ile çerçeve doğal görünümde yüze yapıştırılır.
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
              <p className="mb-3">
                Platformumuz en güncel yapay zeka teknolojilerini bir araya getirir:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">FASHN.ai:</strong> Kıyafet giydirme motoru — ürün fotoğrafından gerçekçi manken görseli üretir.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">MediaPipe FaceMesh:</strong> 468 noktalı yüz tespiti — gözlüğü matematiksel olarak doğru konuma yerleştirir.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Anthropic Claude:</strong> Kıyafet analizi ve stil önerileri için büyük dil modeli.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Cloudinary:</strong> Üretilen görseller güvenli bulut depolama ile saklanır.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">İletişim</h2>
              <p>
                Sorularınız, önerileriniz veya iş birliği talepleriniz için bizimle iletişime geçebilirsiniz.
              </p>
              <div className="mt-3 p-4 bg-white border border-[#e5e5e5] rounded-xl space-y-1">
                <p><strong className="text-[#1a1a1a]">E-posta:</strong> ilgi@ilet.in</p>
                <p><strong className="text-[#1a1a1a]">Web:</strong> www.studyoima.com</p>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-[#1a1a1a]">İMA Tryon</span>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#737373]">
            <Link href="/hakkimizda" className="hover:text-[#1a1a1a] transition-colors">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-[#1a1a1a] transition-colors">İletişim</Link>
            <Link href="/gizlilik" className="hover:text-[#1a1a1a] transition-colors">KVKK</Link>
            <Link href="/satis-sozlesmesi" className="hover:text-[#1a1a1a] transition-colors">Satış Sözleşmesi</Link>
            <a href="https://www.instagram.com/imaaistudio" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.facebook.com/imaaistudio/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          </div>
          <p className="text-xs text-[#a3a3a3]">© {new Date().getFullYear()} İMA Tryon</p>
        </div>
      </footer>
    </div>
  );
}
