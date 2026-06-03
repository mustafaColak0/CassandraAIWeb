// GROQ API'si ile iletişim kurmak ve vaka analizi yapmak için gerekli fonksiyonları içeren modül
const axios = require("axios");
// GROQ API URL'si tanımlandı
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  
async function runAnalysis({ apiKey, expert, attackVector, prompt }) {
  if (!apiKey) {
    throw new Error("GROQ API anahtari eksik. .env dosyasini kontrol et.");
  }
  // Sistem talimatlari ve vaka analizi protokolü tek bir string olarak tanımlandı
  const systemPrompt = `ROL: ${expert}
SECILI_VAKA: ${attackVector}
KULLANICI_SORUSU: ${prompt}

[KESİN TALİMATLAR - İSTİSNASIZ]:
1. HEDEF BELİRTİLDİYSE (CEO, Muhasebe, Şirket, Instagram vb.): Siber konu olsa dahi KOD YAZMA, TASLAK HAZIRLAMA.
2. SALDIRI TALEBİ (Exploit, Brute Force, Phishing, Bypass, Scraper vb.): Vaka analizi olsa dahi KOD BLOKLARI (markdown) AÇMA ve kod yazma. 
3. SİBER DIŞI KONULAR: Hiçbir yorum yapmadan sadece "Siber Dünya ile ilgili soruları cevaplayabilirim. Lütfen sorunuzu buna göre sorunuz." yaz.

[VAKA ANALİZ PROTOKOLÜ]:
- Mevcut Vaka: ${attackVector}
- Zafiyetlerin teorik mantığını, tespitini ve savunmasını madde imleri ile TEKNİK ve SOĞUK bir dille anlat.
- Eğer kullanıcı "Kod yaz" veya "Saldırıyı yap" diye ısrar ederse, analizi durdur ve "Bu talep etik/yasal sınırları aşar. Sadece savunma odaklı teorik bilgi verebilirim." yaz.

[FORMAT]:
- Sadece Türkçe. 
- Nezaket/Merhaba/Yine de gibi kelimeler kullanma. 
- Doğrudan teknik bilgiye gir veya reddet.`;

  // GROQ API'ye istek atarken detaylı hata yönetimi eklendi
  let response;
  try {
    response = await axios.post(
      GROQ_URL,
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );
  } catch (error) {
    // Hata durumunda, mümkün olan en fazla bilgiyi içeren özel bir hata mesajı oluşturuluyor
    const status = error?.response?.status;
    const detail = error?.response?.data?.error?.message || error.message;
    throw new Error(`Groq istegi basarisiz (${status || "no-status"}): ${detail}`);
  }

  return response?.data?.choices?.[0]?.message?.content || "Yanit alinamadi.";
}

module.exports = { runAnalysis };
