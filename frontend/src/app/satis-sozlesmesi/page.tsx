import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Facebook } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "StudyoİMA AI mesafeli satış sözleşmesi ve kullanım koşulları.",
  alternates: { canonical: "https://www.studyoima.com/satis-sozlesmesi" },
  robots: { index: false, follow: false },
};

export default function SatisSozlesmesiPage() {
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

          <h1 className="text-3xl font-semibold tracking-tight mb-2">Mesafeli Satış Sözleşmesi</h1>
          <p className="text-sm text-[#a3a3a3] mb-10">Son güncelleme: Mart 2025 · 6502 Sayılı TKHK Uyumlu</p>

          <div className="space-y-8 text-sm text-[#444] leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 1 — Taraflar</h2>
              <div className="space-y-3">
                <div className="p-4 bg-white border border-[#e5e5e5] rounded-xl">
                  <p className="font-medium text-[#1a1a1a] mb-1">Satıcı (Hizmet Sağlayıcı)</p>
                  <p>Ünvan: StudyoİMA AI</p>
                  <p>Web sitesi: www.studyoima.com</p>
                  <p>E-posta: support@studyoima.com</p>
                </div>
                <div className="p-4 bg-white border border-[#e5e5e5] rounded-xl">
                  <p className="font-medium text-[#1a1a1a] mb-1">Alıcı (Müşteri)</p>
                  <p>Platforma kayıt sırasında bildirilen ad, soyad ve e-posta adresine sahip kişi veya kuruluş.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 2 — Sözleşmenin Konusu</h2>
              <p>
                Bu sözleşme, Alıcı'nın www.studyoima.com adresindeki StudyoİMA AI platformu aracılığıyla
                satın aldığı dijital yapay zeka görsel üretim hizmetlerinin kullanım koşullarını düzenlemektedir.
                Sözleşme, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
                Yönetmeliği kapsamında hazırlanmıştır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 3 — Hizmet Tanımı ve Fiyatları</h2>
              <p className="mb-4">
                Platform üzerinden kıyafet, ghost manken, gözlük, arka plan değiştirme ve video üretimi hizmetleri sunulmaktadır.
                Üretim hakları tüm hizmet türlerinde ortak havuzdan kullanılır; işlem türüne göre harcanan miktar değişir
                (Gözlük: 1 üretim · Ghost Manken: 1 üretim · Arka Plan: 1 üretim · Kıyafet: 2 üretim · Video: 5 üretim).
              </p>

              <div className="overflow-hidden border border-[#e5e5e5] rounded-xl mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-[#f5f5f5]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-[#1a1a1a]">Paket</th>
                      <th className="text-center px-4 py-2.5 font-medium text-[#1a1a1a]">Üretim</th>
                      <th className="text-center px-4 py-2.5 font-medium text-[#1a1a1a]">İndirim</th>
                      <th className="text-center px-4 py-2.5 font-medium text-[#1a1a1a]">Birim Fiyat</th>
                      <th className="text-right px-4 py-2.5 font-medium text-[#1a1a1a]">Fiyat (KDV dahil)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 font-medium">Başlangıç</td>
                      <td className="px-4 py-2.5 text-center text-[#c9a96e] font-medium">5 ücretsiz</td>
                      <td className="px-4 py-2.5 text-center text-[#a3a3a3]">—</td>
                      <td className="px-4 py-2.5 text-center text-[#a3a3a3]">—</td>
                      <td className="px-4 py-2.5 text-right text-[#c9a96e] font-medium">Ücretsiz</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 font-medium">Temel</td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">10</td>
                      <td className="px-4 py-2.5 text-center text-[#a3a3a3]">—</td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">₺15,00</td>
                      <td className="px-4 py-2.5 text-right font-medium">₺150</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 font-medium">Orta</td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">50</td>
                      <td className="px-4 py-2.5 text-center"><span className="text-green-600 font-medium">%5</span></td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">₺14,25</td>
                      <td className="px-4 py-2.5 text-right font-medium">₺712</td>
                    </tr>
                    <tr className="bg-[#0f0f0f]">
                      <td className="px-4 py-2.5 font-medium text-white">Pro <span className="text-[9px] bg-[#c9a96e] text-white px-1.5 py-0.5 rounded-full ml-1">Popüler</span></td>
                      <td className="px-4 py-2.5 text-center text-white/70">100</td>
                      <td className="px-4 py-2.5 text-center"><span className="text-[#c9a96e] font-medium">%10</span></td>
                      <td className="px-4 py-2.5 text-center text-white/70">₺13,50</td>
                      <td className="px-4 py-2.5 text-right font-medium text-white">₺1.350</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 font-medium">İşletme</td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">500</td>
                      <td className="px-4 py-2.5 text-center"><span className="text-green-600 font-medium">%20</span></td>
                      <td className="px-4 py-2.5 text-center text-[#737373]">₺12,00</td>
                      <td className="px-4 py-2.5 text-right font-medium">₺6.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[#737373]">
                Paketler tek seferlik satın alım şeklinde sunulmaktadır. Fiyatlar KDV dahildir ve önceden haber verilmeksizin değiştirilebilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 4 — Ödeme Koşulları</h2>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Ödemeler kredi/banka kartı veya havale/EFT yoluyla yapılır.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Ödeme onaylanır onaylanmaz üretim hakları hesaba tanımlanır.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Paketler tek seferlik satın alım olup otomatik yenileme yapılmaz.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Fatura, ödeme sonrasında e-posta ile gönderilir.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 5 — Hizmetin İfası</h2>
              <p className="mb-3">
                Satın alınan üretim hakları, ödeme onayının ardından anında hesaba yüklenir.
                Görsel üretimi talep edildiğinde:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kullanıcı hesabından işlem türüne göre üretim hakkı düşülür.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>İşlem başarısız olursa üretim hakkı otomatik iade edilir.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Üretilen görseller 90 gün boyunca hesabınızda saklanır.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 6 — Cayma Hakkı</h2>
              <p className="mb-3">
                6502 Sayılı Kanun'un 49. maddesi ve Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi
                uyarınca, dijital içerik ve hizmetlerde cayma hakkı aşağıdaki koşullara tabidir:
              </p>
              <div className="p-4 bg-[#faf5ee] border border-[#e8dcc8] rounded-xl">
                <p className="font-medium text-[#1a1a1a] mb-2">Önemli Bilgilendirme</p>
                <p>
                  Satın alınan üretim hakları dijital hizmet niteliğinde olup, kullanılmamış üretim hakları için
                  satın alma tarihinden itibaren <strong>14 gün</strong> içinde cayma hakkı kullanılabilir.
                  Kullanılmış (görsel üretiminde harcanmış) üretim hakları için cayma hakkı uygulanmaz.
                </p>
              </div>
              <p className="mt-3">
                Cayma talebini <strong className="text-[#1a1a1a]">support@studyoima.com</strong> adresine
                e-posta göndererek iletebilirsiniz. Cayma işlemi onaylandıktan sonra ödeme, kullanılan
                ödeme yöntemine iade edilir (banka işlem süreleri hariç 14 iş günü içinde).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 7 — Paket Kullanımı</h2>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Paketler tek seferlik satın alım şeklinde sunulmaktadır; otomatik yenileme yapılmaz.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kullanılmayan üretim hakları, hesap aktif kaldığı sürece geçerliliğini korur.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kalan üretim hakları hesap aktif olduğu sürece kullanılabilir.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 8 — Fikri Mülkiyet</h2>
              <p className="mb-3">
                Platform aracılığıyla üretilen görsellerin mülkiyeti kullanıcıya aittir. Kullanıcı,
                yüklediği görsellerin telif hakkı sahibi olduğunu veya gerekli lisanslara sahip olduğunu
                beyan eder. StudyoİMA AI aşağıdaki haklarını saklı tutar:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Platform ve yazılımın tüm fikri mülkiyet hakları StudyoİMA AI'a aittir.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Üretilen görseller, onay alınmadan pazarlama materyali olarak kullanılamaz.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 9 — Sorumluluk Sınırlaması</h2>
              <p>
                StudyoİMA AI, yapay zeka tarafından üretilen görsellerin belirli bir sonucu garanti etmediğini
                beyan eder. Platform kesintisiz hizmet taahhüdünde bulunmamakla birlikte, teknik aksaklık
                nedeniyle tamamlanamayan işlemlerde üretim hakları otomatik olarak iade edilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 10 — Uygulanacak Hukuk ve Yetki</h2>
              <p>
                Bu sözleşme Türk Hukuku'na tabidir. Uyuşmazlıklarda öncelikle Tüketici Hakem Heyetleri,
                yasal sınırı aşan uyuşmazlıklarda ise Tüketici Mahkemeleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Madde 11 — İletişim</h2>
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-xl space-y-1">
                <p><strong className="text-[#1a1a1a]">E-posta:</strong> support@studyoima.com</p>
                <p><strong className="text-[#1a1a1a]">Web:</strong> www.studyoima.com</p>
              </div>
            </section>

          </div>

          <div className="mt-10 p-4 bg-[#f5f5f5] rounded-xl text-xs text-[#737373]">
            Bu sözleşmeye onay vererek tüm koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-[#1a1a1a]">StudyoİMA AI</span>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#737373]">
            <Link href="/hakkimizda" className="hover:text-[#1a1a1a] transition-colors">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-[#1a1a1a] transition-colors">İletişim</Link>
            <Link href="/gizlilik" className="hover:text-[#1a1a1a] transition-colors">Gizlilik Politikası</Link>
            <Link href="/satis-sozlesmesi" className="hover:text-[#1a1a1a] transition-colors">Satış Sözleşmesi</Link>
            <a href="https://www.instagram.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="https://www.facebook.com/studyoimaai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </a>
          </div>
          <p className="text-xs text-[#a3a3a3]">© {new Date().getFullYear()} StudyoİMA AI</p>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-5 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-[11px] text-[#b0b0b0] tracking-wide">GÜVENLİ ÖDEME</span>
          <div className="flex items-center gap-2">
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/visa.svg" alt="Visa" width={46} height={15} className="object-contain" />
            </div>
            <div className="h-8 px-3 flex items-center justify-center border border-[#e0e0e0] rounded-md bg-white shadow-sm">
              <Image src="/mastercard.svg" alt="Mastercard" width={38} height={24} className="object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
