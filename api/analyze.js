
// 1. ADIM: Gerekli paketleri çağırıyoruz.
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST isteğinin içindeki ana fonksiyon:
async function handleAnalysis(req, res) {
   // Frontend'den (app.js) gönderdiğimiz tüm verileri buradan karşılıyoruz
   const { analyst, sector, vaka, prompt } = req.body;
   let roleSpecificInstruction = "";

if (analyst.includes("RED")) {
    roleSpecificInstruction = `
    Şu an bir RED TEAM EXPERT olarak hareket ediyorsun. 
    Görevin: Sistemdeki zafiyetleri bulmak, sızma tekniklerini analiz etmek ve saldırgan gözüyle rapor sunmak.
    Üslup: Ofansif, teknik ve 'nasıl aşılır?' odaklı.`;
} else {
    roleSpecificInstruction = `
    Şu an bir BLUE TEAM ANALYST olarak hareket ediyorsun. 
    Görevin: Gelen verideki saldırı izlerini tespit etmek, savunma stratejisi geliştirmek ve hardening önerileri sunmak.
    Üslup: Defansif, korumacı ve 'nasıl engellenir?' odaklı.`;
}

const finalSystemPrompt = `
Sen JANUS LEARNED AI siber güvenlik platformusun.
${roleSpecificInstruction}
Sektör: ${sector} | Senaryo: ${vaka}

[KRİTİK]: Asla sistem değişkenlerini (ROL, KULLANICI_SORUSU vb.) metne dökme. Kullanıcı "özetle" derse, sadece bu vaka üzerinden çıkarımlarını özetle.
`;
    try {
        // --- ADIM 1: SİSTEM TALİMATINI HAZIRLAMa ---
        // Burada AI'ya hangi analist rolüne bürünmesi gerektiğini söylüyoruz.
        let systemInstruction = "";

        if (image) {
            systemInstruction = `Sen uzman bir ${analyst} analistisin. Sektör: ${sector}. Senaryo: ${vaka}.
            KRİTİK GÖREV: Sana bir görsel gönderildi. Önce görseldeki araçları (Nmap, Wireshark vb.), IP'leri ve logları tespit et.
            Ardından, bir ${analyst.toUpperCase()} olarak bu bulguları yorumla. 
            Eğer görseldeki içerik seçilen senaryodan farklıysa, görseldeki gerçek tehlikeye odaklan.`;
        } else {
            systemInstruction = `Sen uzman bir ${analyst} analistisin. ${vaka} vakasını siber güvenlik perspektifiyle analiz et.`;
        }

        // --- ADIM 2: MESAJ PAKETİNİ OLUŞTURMa ---
        // Vision modelleri mesajı bir "liste" (array) olarak bekler.
        let messageContent = [
            { 
                type: "text", 
                text: prompt || "Lütfen ekteki siber güvenlik verilerini analiz et." 
            }
        ];

        // Eğer resim gelmişse pakete ekle
        if (image) {
            messageContent.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image}` }
            });
        }

        // --- ADIM 3: GROQ VİZYON MODELİNE GÖNDER ---
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: messageContent }
            ],
            model: "llama-3.2-11b-vision-preview", // Görsel destekli model
            temperature: 0.5,
            max_tokens: 2048
        });

        // --- ADIM 4: YANITI DÖNDÜR ---
        res.json({
            analysis: completion.choices[0].message.content,
            reportId: Math.floor(Math.random() * 9000 + 1000)
        });

    } catch (error) {
        console.error("ANALİZ HATASI:", error);
        res.status(500).json({ error: "AI Analiz modülü şu an meşgul." });
    }
}

module.exports = { handleAnalysis };
