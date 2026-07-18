// 1. GLOBAL TANIMLAMALAR & CASSANDRA AI SİSTEM BAŞLATICI
// Eğer window üzerinde senaryolar nesnesi tanımlı değilse düzeni bozmamak için başlatıyoruz.
if (!window.scenarios) {
    window.scenarios = {};
}

// LocalStorage üzerinde siber güvenlik vaka geçmişini tutacağımız benzersiz anahtar sürümü
const CHAT_SESSIONS_KEY = "cassandra_soc_history_v4";

// Oturumlar arası çakışmayı ve üst üste binmeyi önleyen reaktif durum (state) değişkenleri
if (typeof window.currentChatId === 'undefined') window.currentChatId = null;
if (typeof window.selectedFile === 'undefined') window.selectedFile = null;

// Backend API entegrasyonu için merkezi URL yapılandırması
const BACKEND_URL = "https://cassandra-ai-backend.onrender.com"; 

//  Siber Arayüz Saatlerini, Karşılama Ekranını ve Dinamik Değişim Tetikleyicilerini Başlatır 
 
function initSystem() {
    // SOC (Security Operations Center) operasyonel takibi için Local ve UTC saat döngüsü
    setInterval(() => {
        const now = new Date();
        const local = document.getElementById("clock-local");
        const utc = document.getElementById("clock-utc");
        if(local) local.textContent = `LOCAL ${now.toLocaleTimeString("tr-TR")}`;
        if(utc) utc.textContent = `UTC ${now.toISOString().substr(11, 8)}`;
    }, 1000);

    // Açılış intro ekranını (overlay) sönümleyerek terminal odağını prompt kutusuna çeker
    setTimeout(() => {
        const intro = document.getElementById('intro-overlay');
        if(intro) {
            intro.style.opacity = '0';
            setTimeout(() => { 
                intro.style.display = 'none'; 
                const pin = document.getElementById("prompt-in");
                if(pin) pin.focus();
            }, 800);
        }
    }, 2500);

    // Seçilen Analist, Sektör ve Vaka tipine göre üst gösterge panelini (HUD) günceller
    const updateDisplay = () => {
        const secVal = document.getElementById("sector-select")?.value || "-";
        const vakVal = document.getElementById("vaka-select")?.value || "-";
        const expEl = document.querySelector('input[name="exp"]:checked');
        
        const rawExp = expEl ? expEl.value.trim().toLowerCase() : "red team expert";
        let fullAnalystName = ""; 

        // Analist rollerine göre siber temalı görsel ve metinsel rozet atamaları
        if (rawExp.includes("red team")) {
            fullAnalystName = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4d6d" style="vertical-align: middle; margin-right: 5px;"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> RED TEAM EXPERT`;
        } else if (rawExp.includes("blue team")) {
            fullAnalystName = "🛡️ BLUE TEAM RESPONDER";
        } else if (rawExp.includes("chief")) {
            fullAnalystName = "🧠 CHIEF STRATEGIST";
        } else if (rawExp.includes("osint")) {
            fullAnalystName = "🔍 OSINT SPECIALIST";
        } else if (rawExp.includes("threat")) {
            fullAnalystName = "🕵️‍♀️ THREAT INTELLIGENCE";
        } else if (rawExp.includes("forensics")) {
            fullAnalystName = "🧪 FORENSICS SPECIALIST";
        } else if (rawExp.includes("compliance")) {
            fullAnalystName = "⚖️ COMPLIANCE OFFICER";
        } else {
            fullAnalystName = `🛡️ ${rawExp.toUpperCase()}`;
        }
        
        if(document.getElementById("display-sector")) document.getElementById("display-sector").textContent = secVal;
        if(document.getElementById("display-vaka")) document.getElementById("display-vaka").textContent = vakVal;
        if(document.getElementById("display-analyst")) document.getElementById("display-analyst").innerHTML = fullAnalystName;
    };

    // HUD elementlerinin durum değişikliklerine event listener'ların bağlanması
    // 'change_hud' asenkron veri yüklenme anlarında tetiklenecek özel durum dinleyicisidir
    document.getElementById("sector-select")?.addEventListener("change", updateDisplay);
    document.getElementById("sector-select")?.addEventListener("change_hud", updateDisplay);
    document.getElementById("vaka-select")?.addEventListener("change", updateDisplay);
    document.querySelectorAll('input[name="exp"]').forEach(r => r.addEventListener("change", updateDisplay));
    
    // Geçmiş paneli (Sidebar/Drawer) açma/kapama tetikleyicisi
    const histBtn = document.getElementById("history-toggle-btn");
    if(histBtn) histBtn.onclick = () => document.getElementById("history-content").classList.toggle("active");
    
    // Tüm local geçmişi temizleme mekanizması ve arayüz sıfırlaması
    const clearBtn = document.getElementById("clear-history-btn");
    if(clearBtn) clearBtn.onclick = () => {
        if(confirm("Tüm geçmiş silinecek. Emin misin?")) {
            localStorage.removeItem(CHAT_SESSIONS_KEY);
            renderHistory();
        }
    };

    // NEW CHAT (Yeni Analiz Paneli Başlatma) Buton Mantığı
    const newChatBtn = document.getElementById("new-chat-btn");
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            const flow = document.getElementById("chat-flow");
            if (flow) {
                flow.innerHTML = ""; // Terminal akışını jilet gibi temizler
                const div = document.createElement("div");
                div.className = "msg ai-msg";
                div.innerHTML = `
                    <div class="msg-head assistant">
                        <span class="chat-avatar assistant gold">CSA</span>
                        <span class="expert-tag">SYSTEM INITIALIZER</span>
                    </div>
                    <div class="msg-body">
                        <p>Yeni analiz paneli başlatıldı. Lütfen incelemek istediğiniz log girdilerini veya görsel dosyaları sisteme aktarın.</p>
                    </div>
                `;
                flow.appendChild(div);
                flow.scrollTop = flow.scrollHeight;
            }
            
            //Aktif vaka kimliğini sıfırlayarak yeni analizi bağımsız hücreye alır
            window.currentChatId = null; 
            
            // Giriş alanları ve dosya önizleme yapılarını temizleme
            const promptIn = document.getElementById("prompt-in");
            if (promptIn) promptIn.value = "";
            const preview = document.getElementById("attachment-preview");
            if (preview) preview.innerHTML = "";
            
            // Input içinde saklı kalabilecek hayalet dosya referanslarını imha etme
            const fileInput = document.getElementById("file-input");
            if (fileInput) fileInput.value = "";
            window.selectedFile = null;

            // Form elementlerini ve dropdown yapılarını başlangıç (default) ayarlarına çekme
            const firstAnalyst = document.querySelector('input[name="exp"]');
            if (firstAnalyst) firstAnalyst.checked = true;

            const sectorSelect = document.getElementById("sector-select");
            if (sectorSelect) {
                sectorSelect.selectedIndex = 0;
                sectorSelect.dispatchEvent(new Event('change')); // Vaka listesini otomatik senkronize eder
            }

            setTimeout(updateDisplay, 100);
        };
    }
    
    // Sistem ilk açıldığında tire kalmaması için HUD panelini ilk verilerle çalıştırır
    updateDisplay();
}


// 2. SENARYO VE VERİ YÜKLEME KATMANI

// Backend üzerinden veya yerel yedek (fallback) havuzundan siber saldırı senaryolarını yükler
async function loadScenarios() {
    const fallbacks = {
        "Ağ Güvenliği": ["Port Tarama", "DDoS Analizi"],
        "Web Uygulama": ["SQL Injection", "XSS", "IDOR"],
        "Sistem Sızma": ["Privilege Escalation", "Lateral Movement"]
    };

    let targetScenarios = fallbacks;

    try {
        const res = await fetch(`${BACKEND_URL}/api/scenarios`);
        if (res.ok) {
            const data = await res.json();
            if (data.scenarios && Object.keys(data.scenarios).length > 0) {
                targetScenarios = data.scenarios;
            }
        }
    } catch (e) { 
        targetScenarios = fallbacks; // Bağlantı hatasında siber kesintiyi önlemek için lokal veriyi basar
    }
    
    // Bellekteki eski senaryo nesne referanslarını temizleyip yenilerini eşler
    Object.keys(window.scenarios).forEach(key => delete window.scenarios[key]);
    Object.assign(window.scenarios, targetScenarios);
    
    const sector = document.getElementById("sector-select");
    const vaka = document.getElementById("vaka-select");
    if(!sector || !vaka) return;
    
    // Dropdown seçeneklerini DOM üzerinde asenkron inşa eder
    sector.innerHTML = Object.keys(window.scenarios).map(s => `<option value="${s}">${s}</option>`).join("");
    sector.onchange = () => {
        if (window.scenarios[sector.value]) {
            vaka.innerHTML = window.scenarios[sector.value].map(v => `<option value="${v}">${v}</option>`).join("");
        }
        // Veriler yüklendiğinde HUD'ın boş (tire) kalmasını önlemek için özel olayı ateşleriz
        const updateEvent = new Event('change_hud', { bubbles: true });
        sector.dispatchEvent(updateEvent);
    };
    sector.onchange();
}

// 3. ÇEKİRDEK MESAJLAŞMA VE GROQ API ANALİZ MOTORU

//Girdileri, metin tabanlı logları veya görselleri işleyerek Groq API üzerinden siber analizi tetikler
 
async function runAnalysis() {
    const input = document.getElementById("prompt-in");
    const btn = document.getElementById("analyze-btn");
    const fileInput = document.getElementById("file-input");
    const text = input && input.value ? input.value.trim() : "";
   
    // Herhangi bir girdi yoksa boş tetiklemeyi iptal eder
    if(!text && (!fileInput || !fileInput.files[0])) return;
    
    //Analiz tetiklendiği an geçmiş bağlarını koparıp bağımsız kanal açar
    window.currentChatId = null;

    // API Key Güvenlik Kontrolü
    const savedKey = localStorage.getItem("cassandra_groq_key");
    if (!savedKey) {
        alert("Lütfen önce giriş ekranından geçerli bir API Key girin! 🔑");
        const modal = document.getElementById("apiKeyModal");
        if(modal) modal.style.display = "flex";
        return;
    }

    // Aktif form parametrelerini toplama
    const expertElement = document.querySelector('input[name="exp"]:checked');
    const expert = expertElement ? expertElement.value : "RED TEAM"; 
    const vaka = document.getElementById("vaka-select") ? document.getElementById("vaka-select").value : "-";
    const sector = document.getElementById("sector-select") ? document.getElementById("sector-select").value : "-";
    
    // Kullanıcı talebini ekrana yansıtma ve arayüzü kilitleme (Race Condition önleyici)
    appendMsg("user", text || "Görsel Analiz Talebi");
    if(input) input.value = "";
    if(btn) {
        btn.disabled = true;
        btn.innerText = "RUNNING...";
    }

    if(document.getElementById('cassandra-status-area')) {
        document.getElementById('cassandra-status-area').style.display = 'flex';
    }

    // YAPAY ZEKA DÜŞÜNÜYOR ANİMASYONU (Dinamik Noktalama)
    let dotInterval;
    const flow = document.getElementById("chat-flow");
    if (flow) {
        const loadingDiv = document.createElement("div");
        loadingDiv.id = "cassandra-loading-bubble";
        loadingDiv.className = "msg ai-msg";
        loadingDiv.innerHTML = `
            <div class="msg-head assistant">
                <span class="chat-avatar assistant blink-animation">CSA</span>
                <span class="expert-tag">CASSANDRA AI // THINKING</span>
            </div>
            <div class="msg-body" style="color: #8892b0; font-style: italic;">
                <span id="dynamic-typing-text">Cassandra AI mesajınıza yanıt üretiyor</span><span id="dynamic-dots"></span>
            </div>
        `;
        flow.appendChild(loadingDiv);
        flow.scrollTop = flow.scrollHeight;

        const dotsSpan = document.getElementById("dynamic-dots");
        let dotCount = 0;
        dotInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            if(dotsSpan) dotsSpan.textContent = ".".repeat(dotCount);
        }, 400);
    }

    try {
        let base64Image = null;
        let finalPrompt = text; 
    
        // MULTIPART DOSYA VE LOG OKUMA KONTROLÜ
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 2 * 1024 * 1024) throw new Error("Dosya çok büyük (Maks 2MB)");
            
            // Log/Metin uzantısı algılama filtresi
            if (file.type.match("text.*") || file.name.endsWith(".txt") || file.name.endsWith(".log") || file.name.endsWith(".json") || file.name.endsWith(".csv")) {
                const fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file); 
                });
                
                // Ham log verisini prompt metnine güvenli bir şekilde ekleme
                finalPrompt = finalPrompt 
                    ? `${finalPrompt}\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`
                    : `Lütfen şu dosya içeriğini analiz et:\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`;
            } 
            else {
                // Eğer log değilse görsel vaka analizi (Vision) için Base64 formatına çevirme
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file); 
                });
            }
        }
        // Llama model gereksinimlerine göre payload yapısını metinsel veya vision olarak dallandırma

        let messageContent;
        let selectedModel = "llama-3.3-70b-versatile"; 
        let finalContent = "";

        if (base64Image) {
            // 🛡️ HİÇBİR DEĞİŞKENE GÜVENMEYİP BURADA DOĞRUDAN STRİNGE ÇEVİRİYORUZ
            // Böylece array hatası vermesi imkansız hale geliyor.
            finalContent = "Kullanıcı bir görsel/ekran görüntüsü yüklemek istedi. Lütfen ona şu sistemi siber güvenlik diliyle açıkla: 'CASSANDRA AI şu an aktif Groq altyapısında sadece metin tabanlı logları ve .txt analizlerini desteklemektedir. Görsel analizi şu an devre dışıdır. Lütfen incelemek istediğiniz log kayıtlarını metin olarak yapıştırın.'";
        } else {
            // 🛡️ ZIRHLI LİMİT KORUMASI (Requested 27565 hatasını kökten bitiriyoruz)
            // 27.565 karakter veya token fark etmeksizin veriyi acımasızca 10.000 karaktere indiriyoruz.
            // Bu sayede 12.000 TPM sınırına takılması matematiksel olarak İMKANSIZ.
            let strictPrompt = finalPrompt || "";
            if (strictPrompt.length > 10000) {
                strictPrompt = strictPrompt.substring(0, 10000) + "\n\n[... UYARI: Log dosyasının devamı Groq API'nin ücretsiz katmanındaki 12.000 TPM sınırı nedeniyle Cassandra tarafından otomatik olarak kesilmiştir. ...]";
            }
            finalContent = strictPrompt;
        }

        // Groq API Entegrasyon Katmanı

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${savedKey}`

            },

            body: JSON.stringify({

                model: "llama-3.3-70b-versatile", 

                messages: [

                    {

                        role: "system",

                        content: `Sen CASSANDRA AI siber güvenlik analistisin. Rolün: ${expert}. Sektör: ${sector}. Vaka Türü: ${vaka}. 

                        Görev Tanımın:

                        1. Sana gönderilen metinleri, (.txt/.log) dosyalarını ve ekran görüntüsü (resim) loglarını siber güvenlik perspektifinden incele.

                        2. Log kayıtlarında veya görselde yer alan IP adreslerini, istek türlerini (GET/POST), hata kodlarını (404, 500, 403), şüpheli payload'ları (SQLi, XSS, Path Traversal vb.) ve anomalileri tespit et.

                        3. Bulduğun şüpheli durumları siber güvenlik uzmanı gözüyle profesyonelce analiz et, eksikleri çıkar ve bir aksiyon planı hazırla.

                        4. Cevaplarını tamamen Türkçe, anlaşılır ver.

                        HALÜSİNASYON ENGELLEME KURALI: Analizlerinde sadece siber güvenlik literatüründe (NIST, ISO, MITRE ATT&CK vb.) GERÇEKTEN var olan terim ve framework'leri kullan. Eğer kullanıcının sorduğu terim veya kısaltma siber güvenlik dünyasında YOKSA, kesinlikle kendi kafandan uydurma. Bilmiyorsan "Bu terim siber güvenlik literatüründe bulunamadı" de.`

                    },

                     {
                        role: "user",
                        content: String(finalContent) // Zorla string yapıyoruz ki API hata fırlatamasın!
                    }
                ],
                temperature: 0.2,
                max_tokens: 1000 // Çıktıyı da kısa tutuyoruz ki limit dolmasın
            })
        });

        
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Groq API Hatası: ${res.status}`);
        }
        
        const data = await res.json();
        const aiResponse = data.choices[0].message.content; 

        if (!aiResponse) {
            throw new Error("Yapay zekadan geçerli bir analiz yanıtı alınamadı.");
        }

        // Elde edilen verileri yapılandırılmış rapor nesnesine dönüştürme
        const report = {
            reportId: Math.floor(Math.random() * 9000 + 1000),
            expert, 
            attackVector: vaka,
            userPrompt: finalPrompt, // İleride geçmişten çağrıldığında kullanıcının ne sorduğunu görmek için kayda ekledik
            analysis: aiResponse,
            timestamp: new Date().toISOString()
        };
        
        // Yanıtı ekrana basma ve geçmiş veri tabanına işleme
        appendMsg("assistant", aiResponse, `${expert} // CAS-${report.reportId}`, report);
        saveHistory(report);

    } catch (e) {
        appendMsg("assistant", `⚠️ Hata: ${e.message}`);
    } finally {
        // Arayüz kilitlerini kaldırma ve temizlik işlemleri (Garbage Collection)
        if(dotInterval) clearInterval(dotInterval);
        const tempBubble = document.getElementById("cassandra-loading-bubble");
        if(tempBubble) tempBubble.remove();
        
        if(document.getElementById('cassandra-status-area')) {
            document.getElementById('cassandra-status-area').style.display = 'none';
        }

        if(btn) {
            btn.disabled = false;
            btn.innerText = "ANALYZE";
        }
        if(fileInput) fileInput.value = "";
        const preview = document.getElementById("attachment-preview");
        if(preview) preview.textContent = "";
        if(input) input.focus();
    }
}

// 4. METİN BİÇİMLENDİRME VE DİNAMİK BUTON (DOM) YÖNETİMİ

// Terminal ekranına mesaj bloklarını dinamik buton yetenekleriyle birlikte yerleştirir
function appendMsg(role, text, meta = "", report = null) {
    const flow = document.getElementById("chat-flow");
    if(!flow) return;
    const div = document.createElement("div");
    div.className = `msg ${role === "user" ? "user-msg" : "ai-msg"}`;

    if(role === "user") {
        div.innerHTML = `<div class="msg-body">${text}</div>`;
    } else {
        // Markdown kalın yazıları temizler ve satır atlamalarını HTML'e uyumlu hale getirir
        const cleanText = text.replace(/\*\*/g, "").replace(/\n/g, "<br>");
        div.innerHTML = `
            <div class="msg-head assistant">
                <span class="chat-avatar assistant gold">CSA</span>
                <span class="expert-tag">${meta}</span>
            </div>
            <div class="msg-body">${cleanText}</div>
        `;
        
        // Alt işlev buton konteynerı (Copy, PDF, Pasla)
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "msg-actions";
        
        // COPY (Panoya Kopyala) Butonu
        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn copy-btn";
        copyBtn.innerText = "COPY";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = "✔️";
            setTimeout(() => { copyBtn.innerText = "COPY"; }, 2000);
        };
        actionsDiv.appendChild(copyBtn);

        // Eğer mesaj bir rapora bağlıysa (Arşiv dahil) PDF ve Paslama yeteneklerini entegre et
        if(report) {
            // STRATEGIC REPORT (PDF İndirme) Butonu
            const pdfBtn = document.createElement("button");
            pdfBtn.className = "action-btn report-btn";
            pdfBtn.innerText = "STRATEGIC REPORT (PDF)";
            pdfBtn.onclick = () => { downloadPdf(report); };
            actionsDiv.appendChild(pdfBtn);

            const allExpertsList = [
                "Red Team Expert",
                "Blue Team Responder",
                "Chief Strategist",
                "OSINT Specialist",
                "Threat Intelligence",
                "Forensics Specialist",
                "Compliance Officer"
            ];
            
            // PASLA (Uzman Değiştirerek Yeniden Analiz) Mekanizması
            if (allExpertsList.length > 1) {
                const passContainer = document.createElement("div");
                passContainer.style.display = "inline-flex";
                passContainer.style.alignItems = "center";
                passContainer.style.gap = "5px";
                passContainer.style.marginLeft = "10px";

                const selectTarget = document.createElement("select");
                selectTarget.style.background = "#1f2937";
                selectTarget.style.color = "#22d3ee";
                selectTarget.style.border = "1px solid #374151";
                selectTarget.style.padding = "4px 8px";
                selectTarget.style.borderRadius = "4px";
                selectTarget.style.fontSize = "11px";
                selectTarget.style.cursor = "pointer";

                const currentExpert = (report.expert || "").trim().toLowerCase();

                allExpertsList.forEach(exp => {
                    if (exp.toLowerCase() !== currentExpert) {
                        const opt = document.createElement("option");
                        opt.value = exp;
                        opt.innerText = exp;
                        selectTarget.appendChild(opt);
                    }
                });

                const passBtn = document.createElement("button");
                passBtn.className = "action-btn pass-btn";
                passBtn.style.color = "#10b981"; 
                passBtn.innerText = "🔄 PASLA";
                passBtn.onclick = () => {
                    const targetExpert = selectTarget.value;
                    const radios = document.querySelectorAll('input[name="exp"]');
                    radios.forEach(r => {
                        if(r.value.trim().toLowerCase() === targetExpert.toLowerCase()) {
                            r.checked = true;
                            r.dispatchEvent(new Event('change')); 
                        }
                    });
                    
                    // Önceki bulguları yeni uzmana brifing olarak paslama prompt şablonu
                    const passText = `Önceki uzman (${report.expert}) şu bulguları raporladı:\n"${text}"\n\nŞimdi rolün: ${targetExpert}. Bu durumu kendi uzmanlık perspektifinden değerlendir, eksikleri bul ve bir aksiyon planı çıkar.`;
                    const input = document.getElementById("prompt-in");
                    if(input) {
                        input.value = passText;
                        runAnalysis();
                    }
                };
                
                passContainer.appendChild(selectTarget);
                passContainer.appendChild(passBtn);
                actionsDiv.appendChild(passContainer);
            }
        }
        
        div.appendChild(actionsDiv);
    }
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
}

// 5. BAĞIMSIZ ANALİZ GEÇMİŞİ VE YAŞAM DÖNGÜSÜ YÖNETİMİ

// Üretilen siber vakayı yerel depolama alanına yazar ve listeyi tazeler
function saveHistory(report) {
    const history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]");
    history.push(report);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(history));
    renderHistory();
}

///Sol paneldeki geçmiş vaka listesini sıfır hata ve bağımsızlık kuralıyla ekrana basar

function renderHistory() {
    const list = document.getElementById("history-list");
    if(!list) return;
    const history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]").reverse();
    list.innerHTML = history.length ? "" : "<small>Geçmiş temiz.</small>";
    
    history.forEach((item, idx) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `<b>CAS-${item.reportId}</b><br><small>${item.attackVector}</small><span class="delete-history-btn">✖</span>`;
        
        div.onclick = (e) => {
            // Silme butonuna basıldıysa doğrudan ID tabanlı siliciyi tetikler
            if(e.target.className === 'delete-history-btn') {
                deleteHistoryItem(item.reportId);
            } else {
                // GEÇMİŞ DETAYI GÖSTERİMİ
                const flow = document.getElementById("chat-flow");
                if (flow) {
                    flow.innerHTML = ""; // Ekranı temizleyip üst üste binmeyi önler
                }

                // Aktif oturum kimliğini seçilen arşiv kartına mühürler
                window.currentChatId = item.reportId; 

                // Kullanıcının attığı orijinal log/soruyu tepeye basar
                appendMsg("user", item.userPrompt || "Geçmiş Log/Talep İçeriği");

                // KESİN ÇÖZÜM: Nesne referansının runtime'da bozulmaması için derin kopyasını (clone) çıkartıp butonlarıyla basar
                const reportClone = JSON.parse(JSON.stringify(item));
                appendMsg("assistant", reportClone.analysis, `ARŞİV: ${reportClone.reportId} // ${reportClone.expert}`, reportClone);
            }
        };
        list.appendChild(div);
    });
}

// İndeks kayması risklerini yok etmek amacıyla raporu benzersiz ID'si üzerinden bulup geçmişten siler

function deleteHistoryItem(reportId) {
    let history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]");
    history = history.filter(item => item.reportId !== reportId);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(history));
    renderHistory();
}

// 6. STRATEJİK PDF RAPORLAMA KATMANI (pdfMake)

 // Analiz sonuçlarını kurumsal siber güvenlik şablonunda PDF dökümanına dönüştürüp indirir

function downloadPdf(data) {
    if(typeof pdfMake === 'undefined') return alert("PDF modülü yüklenemedi.");

    // Dosya adındaki illegal işletim sistemi karakterlerini sterilize etme
    const safeVakaName = data.attackVector.replace(/[\/\\?%*:|"<>]/g, '-'); 
    const fileName = `${safeVakaName} - CAS-${data.reportId}.pdf`;

    
     // Markdown kalın metin belirteçlerini pdfMake nesne dizilerine ayrıştırır
     
    function parseMarkdownToPdf(text) {
        const paragraphs = text.split('\n');
        const formatted = [];
    
        paragraphs.forEach(p => {
            const parts = p.split(/\*\*(.*?)\*\*/g); 
            const textArray = parts.map((part, index) => {
                return (index % 2 === 1) ? { text: part, bold: true, color: '#111827' } : { text: part, color: '#374151' };
            });
            formatted.push({ text: textArray, margin: [0, 0, 0, 8], lineHeight: 1.3 });
        });
        return formatted;
    }

    // PDF Döküman Matrisi Yapılandırması
    const docDef = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60], 
        content: [
            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                text: 'CASSANDRA AI | STRATEGIC INTEL REPORT',
                                alignment: 'center',
                                fontSize: 16,
                                bold: true,
                                color: '#00e5ff', 
                                fillColor: '#050b14', 
                                margin: [0, 12, 0, 12] 
                            }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 20] 
            },
            {
                table: {
                    headerRows: 0,
                    widths: ['25%', '75%'],
                    body: [
                        [{ text: 'ID', color: '#111827' }, { text: `CAS-${data.reportId}`, color: '#111827' }],
                        [{ text: 'VAKA', color: '#111827' }, { text: data.attackVector, color: '#111827' }],
                        [{ text: 'ANALİST', color: '#111827' }, { text: data.expert, color: '#111827' }],
                        [{ text: 'TARİH', color: '#111827' }, { text: new Date(data.timestamp || Date.now()).toLocaleString('tr-TR'), color: '#111827' }]
                    ]
                },
                margin: [0, 0, 0, 25]
            },
            ...parseMarkdownToPdf(data.analysis)
        ],
        defaultStyle: {
            fontSize: 11
        }
    };

    pdfMake.createPdf(docDef).download(fileName);
}

// 7. GİRİŞ MODAL KONTROLÜ VE ETKİLEŞİM DİNLEYİCİLERİ

// DOM Hazır olduğunda API anahtar durumunu analiz edip yetkilendirme kapısını yönetir
document.addEventListener("DOMContentLoaded", () => {
    const savedKey = localStorage.getItem("cassandra_groq_key");
    const modal = document.getElementById("apiKeyModal");
    
    if (!savedKey && modal) {
        modal.style.display = "flex";
    } else if (modal) {
        modal.style.display = "none";
    }
    
    const saveBtn = document.getElementById("saveKeyBtn");
    if(saveBtn) {
        saveBtn.addEventListener("click", () => {
            const keyInput = document.getElementById("modalApiKeyInput").value.trim();
            
            if (!keyInput.startsWith("gsk_")) {
                alert("Lütfen 'gsk_' ile başlayan geçerli bir Groq API Key giriniz ❌");
                return;
            }

            localStorage.setItem("cassandra_groq_key", keyInput);
            if(modal) modal.style.display = "none";
            window.location.reload(); 
        });
    }
});

// Sistem yükleme zinciri tetikleyicileri
// Önce asenkron verileri çekip kutuları besliyoruz, ardından HUD paneli (initSystem) ayağa kalkıyor.
window.onload = async () => { 
    await loadScenarios(); 
    initSystem(); 
    renderHistory(); 
};

// UI Element Buton Click Olay İlişkilendirmeleri
if(document.getElementById("analyze-btn")) {
    document.getElementById("analyze-btn").onclick = runAnalysis;
}
if(document.getElementById("prompt-in")) {
    document.getElementById("prompt-in").onkeydown = (e) => { if(e.key === "Enter") runAnalysis(); };
}
if(document.getElementById("attach-btn")) {
    document.getElementById("attach-btn").onclick = () => { document.getElementById("file-input").click(); };
}
if(document.getElementById("file-input")) {
    document.getElementById("file-input").onchange = (e) => {
        const prev = document.getElementById("attachment-preview");
        if(prev) prev.textContent = e.target.files[0] ? `📁 ${e.target.files[0].name}` : "";
    };
}


// 8. GELİŞMİŞ PANO RESİM/LOG YAPIŞTIRMA (CLIPBOARD PASTE) DESTEĞİ

document.addEventListener('paste', (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (let index in items) {
        const item = items[index];
        
        // Panoya anlık kopyalanan ekran görüntülerini algılayıp DataTransfer mimarisi ile input'a besler
        if (item.kind === 'file' && item.type.includes('image')) {
            const blob = item.getAsFile();
            const fileInput = document.querySelector('input[type="file"]');
            
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                const file = new File([blob], `Ekran_Goruntusu_${Date.now()}.png`, { type: item.type });
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                const promptIn = document.getElementById("prompt-in");
                if (promptIn && promptIn.value === "") {
                    promptIn.value = "[📸 Ekran görüntüsü eklendi, analiz için butona basın...]";
                    setTimeout(() => {
                        if(promptIn.value === "[📸 Ekran görüntüsü eklendi, analiz için butona basın...]") {
                            promptIn.value = "";
                        }
                    }, 2000);
                }
                console.log("📸 Resim panodan başarıyla arabelleğe eklendi!");
            }
        }
    }
});
