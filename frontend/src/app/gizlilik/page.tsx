import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Instagram, Facebook } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK — İMA Tryon",
  description: "İMA Tryon KVKK aydınlatma metni ve kişisel verilerin korunması.",
};

export default function GizlilikPage() {
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

          <h1 className="text-3xl font-semibold tracking-tight mb-2">KVKK Aydınlatma Metni</h1>
          <p className="text-sm text-[#a3a3a3] mb-10">Son güncelleme: Mart 2025 · 6698 Sayılı KVKK</p>

          <div className="space-y-8 text-sm text-[#444] leading-relaxed">

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">1. Veri Sorumlusu</h2>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu
                İMA Tryon'dur (bundan böyle "Şirket" olarak anılacaktır). Şirket, platformu aracılığıyla
                toplanan kişisel verileri bu Gizlilik İlkeleri çerçevesinde işlemektedir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">2. Toplanan Kişisel Veriler</h2>
              <p className="mb-3">Platformumuzu kullandığınızda aşağıdaki veriler toplanabilir:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Hesap bilgileri:</strong> Ad soyad, e-posta adresi, şifreli hesap bilgileri.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Yüklenen görseller:</strong> Ürün fotoğrafları, gözlük görselleri ve üretilen çıktı görselleri.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Kullanım verileri:</strong> Üretim geçmişi, üretim hakkı kullanım kayıtları, oturum bilgileri.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#c9a96e] font-medium flex-shrink-0">·</span>
                  <span><strong className="text-[#1a1a1a]">Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi, erişim zamanları.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">3. Verilerin İşlenme Amaçları</h2>
              <p className="mb-3">Toplanan kişisel veriler aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Hizmetin sağlanması ve yapay zeka görsel üretiminin gerçekleştirilmesi</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kullanıcı hesabının yönetimi ve kimlik doğrulama</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kredi ve fatura işlemlerinin yürütülmesi</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Teknik destek ve müşteri hizmetlerinin sunulması</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Hizmet kalitesinin iyileştirilmesi ve yeni özellik geliştirme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Yasal yükümlülüklerin yerine getirilmesi</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">4. Görsel Verilerin İşlenmesi</h2>
              <p className="mb-3">
                Yüklediğiniz ürün fotoğrafları ve üretilen görseller, hizmetin sunulması amacıyla
                Cloudinary bulut depolama altyapısında saklanmaktadır. Bu görseller:
              </p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Yalnızca sizin hesabınızla ilişkilendirilir ve üçüncü taraflarla paylaşılmaz.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Hesabınızı sildiğinizde görselleriniz de sistemden kaldırılır.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Yapay zeka işleme sürecinde üçüncü taraf API sağlayıcılarına (FASHN.ai, Replicate) iletilir; bu sağlayıcılar kendi gizlilik politikalarına tabidir.</span></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">5. Verilerin Üçüncü Taraflarla Paylaşımı</h2>
              <p className="mb-3">Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span><strong className="text-[#1a1a1a]">Hizmet sağlayıcılar:</strong> Altyapı, ödeme işleme ve yapay zeka hizmetleri için.</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span><strong className="text-[#1a1a1a]">Yasal zorunluluklar:</strong> Mahkeme kararı veya yasal düzenleme gerektirdiğinde.</span></li>
              </ul>
              <p className="mt-3">Verileriniz ticari amaçla satılmaz veya kiralanmaz.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">6. Veri Güvenliği</h2>
              <p>
                Kişisel verilerinizi korumak için HTTPS şifrelemesi, bcrypt ile şifrelenmiş parolalar,
                JWT tabanlı kimlik doğrulama ve güvenli bulut altyapısı kullanılmaktadır. Bununla birlikte,
                internet üzerinden veri iletiminin %100 güvenli olmadığını hatırlatırız.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">7. Çerezler</h2>
              <p>
                Platformumuz, oturum yönetimi için zorunlu çerezler kullanmaktadır. Bu çerezler giriş
                durumunuzu ve erişim tokenlarınızı saklar. Analitik veya pazarlama çerezi kullanılmamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">8. KVKK Kapsamındaki Haklarınız</h2>
              <p className="mb-3">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul className="space-y-2 pl-4">
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kişisel verilerinizin işlenip işlenmediğini öğrenme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>İşlenme amacı ve amacına uygun kullanılıp kullanılmadığını öğrenme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Kişisel verilerin silinmesini veya yok edilmesini isteme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>İşlenen verilerin münhasıran otomatik sistemler aracılığıyla aleyhinize sonuç doğurmasına itiraz etme</span></li>
                <li className="flex gap-2"><span className="text-[#c9a96e] font-medium flex-shrink-0">·</span><span>Zararın giderilmesini talep etme</span></li>
              </ul>
              <p className="mt-3">
                Bu haklarınızı kullanmak için <strong className="text-[#1a1a1a]">ilgi@ilet.in</strong> adresine
                yazılı başvurabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">9. Değişiklikler</h2>
              <p>
                Bu gizlilik ilkeleri zaman zaman güncellenebilir. Önemli değişikliklerde kayıtlı
                e-posta adresinize bildirim gönderilecektir. Güncel versiyona her zaman bu sayfadan ulaşabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">10. İletişim</h2>
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-xl space-y-1">
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
