let scenarios = {};
const CHAT_SESSIONS_KEY = "cassandra_soc_history_v4";

// 1. SİSTEM BAŞLATMA
function initSystem() {
    // Saat güncelleme
    setInterval(() => {
        const now = new Date();
        const local = document.getElementById("clock-local");
        const utc = document.getElementById("clock-utc");
        if(local) local.textContent = `LOCAL ${now.toLocaleTimeString("tr-TR")}`;
        if(utc) utc.textContent = `UTC ${now.toISOString().substr(11, 8)}`;
    }, 1000);

    // Giriş ekranı animasyonu
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

    // Seçilen değerleri anlık olarak sağ üst köşeye yansıtma
    const updateDisplay = () => {
        const secVal = document.getElementById("sector-select")?.value || "-";
        const vakVal = document.getElementById("vaka-select")?.value || "-";
        const expEl = document.querySelector('input[name="exp"]:checked');
        const expVal = expEl ? expEl.value.split(' ')[0].toUpperCase() : "RED";
        
        if(document.getElementById("display-sector")) document.getElementById("display-sector").textContent = secVal;
        if(document.getElementById("display-vaka")) document.getElementById("display-vaka").textContent = vakVal;
        if(document.getElementById("display-analyst")) document.getElementById("display-analyst").textContent = expVal;
    };

    document.getElementById("sector-select")?.addEventListener("change", updateDisplay);
    document.getElementById("vaka-select")?.addEventListener("change", updateDisplay);
    document.querySelectorAll('input[name="exp"]').forEach(r => r.addEventListener("change", updateDisplay));
    
    // UI etkileşimi: Geçmiş Modülü
    const histBtn = document.getElementById("history-toggle-btn");
    if(histBtn) histBtn.onclick = () => document.getElementById("history-content").classList.toggle("active");
    // Geçmiş temizleme butonu
    const clearBtn = document.getElementById("clear-history-btn");
    if(clearBtn) clearBtn.onclick = () => {
        if(confirm("Tüm geçmiş silinecek. Emin misin?")) {
            localStorage.removeItem(CHAT_SESSIONS_KEY);
            renderHistory();
        }
    };
    // İlk yüklemede değerleri güncelle
    setTimeout(updateDisplay, 500);
}

// 2. SENARYO YÜKLEME
async function loadScenarios() {
    // Eğer API başarısız olursa diye bir yedek (fallback) senaryo seti tanımlıyoruz
    const fallbacks = {
        "Ağ Güvenliği": ["Port Tarama", "DDoS Analizi"],
        "Web Uygulama": ["SQL Injection", "XSS", "IDOR"],
        "Sistem Sızma": ["Privilege Escalation", "Lateral Movement"]
    };

    try {
        const res = await fetch("/api/scenarios");
        const data = await res.json();
        scenarios = (data.scenarios && Object.keys(data.scenarios).length > 0) ? data.scenarios : fallbacks;
    } catch { scenarios = fallbacks; }
    // Senaryolar yüklendikten sonra dropdownları dolduruyoruz
    const sector = document.getElementById("sector-select");
    const vaka = document.getElementById("vaka-select");
    if(!sector || !vaka) return;
    // Sektör dropdownunu dolduruyoruz
    sector.innerHTML = Object.keys(scenarios).map(s => `<option value="${s}">${s}</option>`).join("");
    sector.onchange = () => {
        vaka.innerHTML = scenarios[sector.value].map(v => `<option value="${v}">${v}</option>`).join("");
    };
    sector.onchange();
}

// 3. MESAJLAŞMA VE ANALİZ
async function runAnalysis() {
    const input = document.getElementById("prompt-in");
    const btn = document.getElementById("analyze-btn");
    const fileInput = document.getElementById("file-input");
    const text = input.value.trim();
    // Eğer hem metin yoksa hem de dosya eklenmemişse, kullanıcıyı uyarıyoruz       
    if(!text && (!fileInput || !fileInput.files[0])) return;
    // Seçilen uzmanı alıyoruz, eğer hiçbiri seçilmemişse varsayılan olarak "RED TEAM" atıyoruz
    const expertElement = document.querySelector('input[name="exp"]:checked');
    const expert = expertElement ? expertElement.value : "RED TEAM"; 
    const vaka = document.getElementById("vaka-select").value;
    const sector = document.getElementById("sector-select").value;
    // Kullanıcının mesajını hemen ekrana basıyoruz (dosya içeriği veya görsel eklenmiş olsa bile)
    appendMsg("user", text || "Görsel Analiz Talebi");
    input.value = "";
    btn.disabled = true;
    btn.innerText = "RUNNING...";

try {
        let base64Image = null;// Eğer dosya eklenmişse, önce dosya türünü kontrol ediyoruz ve ona göre işlemi yapıyoruz
        let finalPrompt = text; // API'ye gidecek nihai metin
    
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 2 * 1024 * 1024) throw new Error("Dosya çok büyük (Maks 2MB)");
            
            // 1. DURUM: Dosya bir metin dosyasıysa (.txt)
            if (file.type.match("text.*") || file.name.endsWith(".txt")) {
                // Dosya içeriğini okuyup metin olarak API'ye ekliyoruz
                const fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file); // Metin olarak oku
                });
                
                // Kullanıcının yazdığı mesaja dosya içeriğini görünmez bir şekilde ekle
                finalPrompt = finalPrompt 
                    ? `${finalPrompt}\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`
                    : `Lütfen şu dosya içeriğini analiz et:\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`;
            } 
            // 2. DURUM: Dosya resimse (png, jpg, jpeg, vb.)
            else {
                // Resmi base64 formatına çeviriyoruz ve sadece veri kısmını alıyoruz (data:image/png;base64,... kısmını temizliyoruz)
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file); // Resim olarak oku
                });
            }
        }

        // fetch isteğini güncelliyoruz: Artık finalPrompt ve base64Image'i API'ye gönderiyoruz
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
                prompt: finalPrompt, 
                expert: expert, 
                attackVector: vaka,
                sector: sector,
                image: base64Image 
            })
        });
        
        if(!res.ok) throw new Error("Sunucu yanıt vermedi");
        const data = await res.json();
        const report = {
            reportId: data.reportId || Math.floor(Math.random()*9000+1000),
            expert, 
            attackVector: vaka, 
            analysis: data.analysis,
            timestamp: new Date().toISOString()
        };
        // API'den gelen cevaba göre mesajı ekrana basıyoruz
        appendMsg("assistant", data.analysis, `${expert} // CAS-${report.reportId}`, report);
        saveHistory(report);

    } catch (e) {
        appendMsg("assistant", `⚠️ Hata: ${e.message === "Sunucu yanıt vermedi" ? "Bağlantı kesildi." : e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = "ANALYZE";
        if(fileInput) fileInput.value = "";
        const preview = document.getElementById("attachment-preview");
        if(preview) preview.textContent = "";
        input.focus();
    }
}

// 4. MESAJ EKLEME VE YENİ PASLAMA SİSTEMİ
function appendMsg(role, text, meta = "", report = null) {
    const flow = document.getElementById("chat-flow");
    if(!flow) return;
    const div = document.createElement("div");
    div.className = `msg ${role === "user" ? "user-msg" : "ai-msg"}`;

    if(role === "user") {
        div.innerHTML = `<div class="msg-body">${text}</div>`;
    } else {
        const cleanText = text.replace(/\*\*/g, "").replace(/\n/g, "<br>");
        div.innerHTML = `
            <div class="msg-head assistant">
                <span class="chat-avatar assistant gold">CSA</span>
                <span class="expert-tag">${meta}</span>
            </div>
            <div class="msg-body">${cleanText}</div>
        `;
        // Mesajın altına aksiyon butonları ekliyoruz (COPY, PDF, PASLA)
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "msg-actions";
        
        // COPY
        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn copy-btn";
        copyBtn.innerText = "COPY";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = "✔️";
            setTimeout(() => copyBtn.innerText = "COPY", 2000);
        };
        actionsDiv.appendChild(copyBtn);

        if(report) {
            // PDF
            const pdfBtn = document.createElement("button");
            pdfBtn.className = "action-btn report-btn";
            pdfBtn.innerText = "STRATEGIC REPORT (PDF)";
            pdfBtn.onclick = () => downloadPdf(report);
            actionsDiv.appendChild(pdfBtn);

            
          
            // SEÇİMLİ PASLA BÖLÜMÜ 
           // HTML'de name özelliği unutulmuş olma ihtimaline karşı tüm rolleri garantili bir listeye alıyoruz
            const allExpertsList = [
                "Red Team Expert",
                "Blue Team Responder",
                "Chief Strategist",
                "OSINT Specialist",
                "Threat Intelligence",
                "Forensics Specialist",
                "Compliance Officer"
            ];
            
            if (allExpertsList.length > 1) {
                const passContainer = document.createElement("div");
                passContainer.style.display = "inline-flex";
                passContainer.style.alignItems = "center";
                passContainer.style.gap = "5px";
                passContainer.style.marginLeft = "10px";

                // Açılır Kutu (Dropdown)
                const selectTarget = document.createElement("select");
                selectTarget.style.background = "#1f2937";
                selectTarget.style.color = "#22d3ee";
                selectTarget.style.border = "1px solid #374151";
                selectTarget.style.padding = "4px 8px";
                selectTarget.style.borderRadius = "4px";
                selectTarget.style.fontSize = "11px";
                selectTarget.style.cursor = "pointer";

                // Mevcut uzmanı al, boşlukları sil ve küçük harfe çevir (Kesin eşleşme için)
                const currentExpert = (report.expert || "").trim().toLowerCase();

                // Kendisi hariç diğer uzmanları ekle
                allExpertsList.forEach(exp => {
                    if (exp.toLowerCase() !== currentExpert) {
                        const opt = document.createElement("option");
                        opt.value = exp;
                        opt.innerText = exp;
                        selectTarget.appendChild(opt);
                    }
                });

                // Pasla Butonu
                const passBtn = document.createElement("button");
                passBtn.className = "action-btn pass-btn";
                passBtn.style.color = "#10b981"; 
                passBtn.innerText = `🔄 PASLA`;
                // Pasla butonuna tıklandığında seçilen hedefe göre mesajı güncelle ve analizi tetikle
                passBtn.onclick = () => {
                    const targetExpert = selectTarget.value;
                    
                    // UI'daki takım butonunu bul ve otomatik değiştir
                    const radios = document.querySelectorAll('input[name="exp"]');
                    radios.forEach(r => {
                        // Burada da garanti olsun diye toLowerCase ile arıyoruz
                        if(r.value.trim().toLowerCase() === targetExpert.toLowerCase()) {
                            r.checked = true;
                            r.dispatchEvent(new Event('change')); 
                        }
                    });
                    
                    // Dinamik paslaşma metnini oluştur
                    const passText = `Önceki uzman (${report.expert}) şu bulguları raporladı:\n"${text}"\n\nŞimdi rolün: ${targetExpert}. Bu durumu kendi uzmanlık perspektifinden değerlendir, eksikleri bul ve bir aksiyon planı çıkar.`;
                    // Kullanıcının yazdığı mesaj kutusuna paslaşma metnini ekle
                    const input = document.getElementById("prompt-in");
                    input.value = passText;
                    
                    // Analizi tetikle
                    runAnalysis();
                };
                // Pasla bölümünü aksiyonlar arasına ekle
                passContainer.appendChild(selectTarget);
                passContainer.appendChild(passBtn);
                actionsDiv.appendChild(passContainer);
            }
        }
        
        div.appendChild(actionsDiv);
    }
    // Mesajı akışa ekledikten sonra otomatik olarak en alta kaydırıyoruz
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
}

// 5. GEÇMİŞ YÖNETİMİ
function saveHistory(report) {
    const history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]");
    history.push(report);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(history));
    renderHistory();
}

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
            if(e.target.className === 'delete-history-btn') {
                deleteHistoryItem(history.length - 1 - idx);
            } else {
                appendMsg("assistant", item.analysis, `ARŞİV: ${item.reportId}`, item);
            }
        };
        list.appendChild(div);
    });
}
// Geçmişten tek bir öğeyi silme fonksiyonu
function deleteHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]");
    history.splice(index, 1);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(history));
    renderHistory();
}

// 6. PDF ÇIKTISI
function downloadPdf(data) {
    if(typeof pdfMake === 'undefined') return alert("PDF modülü yüklenemedi.");

    // 1. DOSYA İSMİ DEĞİŞİKLİĞİ (Vaka Adı - CAS-ID)
    const safeVakaName = data.attackVector.replace(/[/\\?%*:|"<>]/g, '-'); 
    const fileName = `${safeVakaName} - CAS-${data.reportId}.pdf`;

    // 2. MARKDOWN ÇÖZÜCÜ (En iyi metin okuma deneyimi için)
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

    // 3. GÖRSELDEKİ BİREBİR PDF TASARIMI
    const docDef = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60], 
        content: [
            // Siyah/Neon Mavi Banner Başlık
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
                                color: '#00e5ff', // Neon mavi
                                fillColor: '#050b14', // Koyu siyah/lacivert zemin
                                margin: [0, 12, 0, 12] 
                            }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 20] 
            },
            
            //Keskin Çizgili Tablo Yapısı
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
                // Varsayılan tablo stili çizgili (grid) olduğu için layout belirtmiyoruz, tam resimdeki gibi çıkıyor.
                margin: [0, 0, 0, 25]
            },
            
            // AI Metni (Markdown çözülmüş temiz format)
            ...parseMarkdownToPdf(data.analysis)
        ],
        defaultStyle: {
            fontSize: 11
        }
    };

    // PDF'i oluştur ve indir
    pdfMake.createPdf(docDef).download(fileName);
}
// BAŞLATICILAR
// Sayfa yüklendiğinde sistemi başlat, senaryoları yükle ve geçmişi renderla
window.onload = async () => { 
    initSystem(); 
    await loadScenarios(); 
    renderHistory(); 
};
document.getElementById("analyze-btn").onclick = runAnalysis;
document.getElementById("prompt-in").onkeydown = (e) => { if(e.key === "Enter") runAnalysis(); };
document.getElementById("attach-btn").onclick = () => document.getElementById("file-input").click();
document.getElementById("file-input").onchange = (e) => {
    const prev = document.getElementById("attachment-preview");
    if(prev) prev.textContent = e.target.files[0] ? `📁 ${e.target.files[0].name}` : "";
};
// 7. PANO RESİM YAPIŞTIRMA DESTEĞİ
document.addEventListener('paste', (event) => {
    // Panodaki verileri al
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (let index in items) {
        const item = items[index];
        
        // Eğer yapıştırılan şey bir dosya ve bir resimse
        if (item.kind === 'file' && item.type.includes('image')) {
            const blob = item.getAsFile();
            
            // Senin HTML'deki dosya yükleme inputunu bul
            const fileInput = document.querySelector('input[type="file"]');
            
            if (fileInput) {
                // Yapıştırılan resmi file input'un içine sanal olarak yerleştir
                const dataTransfer = new DataTransfer();
                const file = new File([blob], `Ekran_Goruntusu_${Date.now()}.png`, { type: item.type });
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                //Kullanıcının yazdığı mesaj kutusuna ufak bir bildirim bırak
                const promptIn = document.getElementById("prompt-in");
                if (promptIn && promptIn.value === "") {
                    promptIn.value = "[📸 Ekran görüntüsü eklendi, analiz için butona basın...]";
                    setTimeout(() => {
                        if(promptIn.value === "[📸 Ekran görüntüsü eklendi, analiz için butona basın...]") {
                            promptIn.value = "";
                        }
                    }, 2000);
                }
                console.log("📸 Resim panodan başarıyla eklendi!");
            }
        }
    }
});