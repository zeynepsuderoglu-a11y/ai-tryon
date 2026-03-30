export default function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyoİMA AI",
    url: "https://studyoima.com",
    logo: "https://studyoima.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@studyoima.com",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
    sameAs: [
      "https://www.instagram.com/studyoimaai",
      "https://www.facebook.com/imaaistudio/",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Merkez Mh. Merter Sk. No:42/1",
      addressLocality: "Güngören",
      addressRegion: "İstanbul",
      addressCountry: "TR",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StudyoİMA AI",
    url: "https://studyoima.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://studyoima.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StudyoİMA AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://studyoima.com",
    description:
      "Yapay zeka ile ürün fotoğrafından profesyonel manken görseli oluşturma. Kıyafet try-on, gözlük try-on ve video üretimi.",
    offers: [
      {
        "@type": "Offer",
        name: "Başlangıç Paketi",
        price: "0",
        priceCurrency: "TRY",
        description: "5 ücretsiz üretim hakkı",
      },
      {
        "@type": "Offer",
        name: "Standart Paket",
        price: "750",
        priceCurrency: "TRY",
        description: "50 üretim hakkı",
      },
      {
        "@type": "Offer",
        name: "Profesyonel Paket",
        price: "1350",
        priceCurrency: "TRY",
        description: "100 üretim hakkı",
      },
    ],
    featureList: [
      "Yapay zeka kıyafet görselleştirme",
      "Gözlük try-on",
      "AI video üretimi",
      "Toplu işlem",
      "Stüdyo kalitesinde çıktı",
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "StudyoİMA AI nasıl çalışır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ürün fotoğrafınızı yükleyin, bir manken seçin. Yapay zeka saniyeler içinde profesyonel kıyafet görseli oluşturur. Gözlük için de aynı işlem geçerlidir.",
        },
      },
      {
        "@type": "Question",
        name: "Hangi kıyafet türleri destekleniyor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Üst giyim, alt giyim, elbise, tulum, ceket, kaban dahil tüm kıyafet türleri desteklenmektedir. Ghost mannequin veya düz ürün fotoğrafı ile çalışır.",
        },
      },
      {
        "@type": "Question",
        name: "Üretim hakkı ne kadar süre geçerli?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Satın alınan üretim hakları süresiz geçerlidir, son kullanma tarihi yoktur.",
        },
      },
      {
        "@type": "Question",
        name: "Çıktı görsellerin kalitesi nasıl?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Platformumuz, 10 yıllık stüdyo fotoğrafçılığı deneyimiyle eğitilmiş yapay zeka modelleri kullanır. Çıktılar profesyonel katalog çekimi kalitesindedir.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
