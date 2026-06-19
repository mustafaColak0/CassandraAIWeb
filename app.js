// 1. SİSTEM BAŞLATMA VE GLOBAL TANIMLAMALAR
// Diğer dosyalarla çakışmaması için window objesi üzerinden güvenli kontrol yapıyoruz
if (!window.scenarios) {
    window.scenarios = {};
}

const CHAT_SESSIONS_KEY = "cassandra_soc_history_v4";

// BACKEND URLSİ (Render üzerindeki yeni backend'e yönlendiriyor)
const BACKEND_URL = "https://cassandra-ai-backend.onrender.com"; 

function initSystem() {
    setInterval(() => {
        const now = new Date();
        const local = document.getElementById("clock-local");
        const utc = document.getElementById("clock-utc");
        if(local) local.textContent = `LOCAL ${now.toLocaleTimeString("tr-TR")}`;
        if(utc) utc.textContent = `UTC ${now.toISOString().substr(11, 8)}`;
    }, 1000);

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

const updateDisplay = () => {
        const secVal = document.getElementById("sector-select")?.value || "-";
        const vakVal = document.getElementById("vaka-select")?.value || "-";
        const expEl = document.querySelector('input[name="exp"]:checked');
        
        const rawExp = expEl ? expEl.value.trim().toLowerCase() : "red team expert";
        let fullAnalystName = ""; 

        // Sadece Red Team için özel SVG kalkanı, diğerleri emojili kararlı tasarım
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
        
        // Uzman adını güncelliyoruz, böylece kullanıcı seçimine göre dinamik olarak değişiyor
        if(document.getElementById("display-analyst")) document.getElementById("display-analyst").innerHTML = fullAnalystName;
    };

    document.getElementById("sector-select")?.addEventListener("change", updateDisplay);
    document.getElementById("vaka-select")?.addEventListener("change", updateDisplay);
    document.querySelectorAll('input[name="exp"]').forEach(r => r.addEventListener("change", updateDisplay));
    
    const histBtn = document.getElementById("history-toggle-btn");
    if(histBtn) histBtn.onclick = () => document.getElementById("history-content").classList.toggle("active");
    
    const clearBtn = document.getElementById("clear-history-btn");
    if(clearBtn) clearBtn.onclick = () => {
        if(confirm("Tüm geçmiş silinecek. Emin misin?")) {
            localStorage.removeItem(CHAT_SESSIONS_KEY);
            renderHistory();
        }
    };
    // YENİ SOHBET BUTONU
    const newChatBtn = document.getElementById("new-chat-btn");
    if(newChatBtn) {
        newChatBtn.onclick = () => {
            const flow = document.getElementById("chat-flow");
            if(flow) {
                flow.innerHTML = ""; // Ekrandaki mesajları temizler
                // İsteğe bağlı: Yeni sohbet açıldığında AI'dan ilk mesaj gelsin
                appendMsg("assistant", "Yeni analiz paneli başlatıldı. Lütfen incelemek istediğiniz log girdilerini veya görsel dosyaları sisteme aktarın.", "SYSTEM // RESET");
            }
            };
    }
    setTimeout(updateDisplay, 500);
}

// 2. SENARYO YÜKLEME
async function loadScenarios() {
    const fallbacks = {
        "Ağ Güvenliği": ["Port Tarama", "DDoS Analizi"],
        "Web Uygulama": ["SQL Injection", "XSS", "IDOR"],
        "Sistem Sızma": ["Privilege Escalation", "Lateral Movement"]
    };

    let targetScenarios = fallbacks;

    try {
        const res = await fetch(`${BACKEND_URL}/api/scenarios`);
        const data = await res.json();
        if (data.scenarios && Object.keys(data.scenarios).length > 0) {
            targetScenarios = data.scenarios;
        }
    } catch (e) { 
        targetScenarios = fallbacks; 
    }
    
// Global senaryoları güncelleyoruz, böylece diğer fonksiyonlar güncel verilere erişebilir
    Object.keys(window.scenarios).forEach(key => delete window.scenarios[key]);
    Object.assign(window.scenarios, targetScenarios);
    
    const sector = document.getElementById("sector-select");
    const vaka = document.getElementById("vaka-select");
    if(!sector || !vaka) return;
    
    sector.innerHTML = Object.keys(window.scenarios).map(s => `<option value="${s}">${s}</option>`).join("");
    sector.onchange = () => {
        vaka.innerHTML = window.scenarios[sector.value].map(v => `<option value="${v}">${v}</option>`).join("");
    };
    sector.onchange();
}

// 3. MESAJLAŞMA VE ANALİZ
async function runAnalysis() {
    const input = document.getElementById("prompt-in");
    const btn = document.getElementById("analyze-btn");
    const fileInput = document.getElementById("file-input");
    const text = input && input.value ? input.value.trim() : "";
          
    if(!text && (!fileInput || !fileInput.files[0])) return;
    
    // Kullanıcının saklanan Groq API anahtarını alıyoruz
    const savedKey = localStorage.getItem("cassandra_groq_key");
    if (!savedKey) {
        alert("Lütfen önce giriş ekranından geçerli bir API Key girin! 🔑");
        const modal = document.getElementById("apiKeyModal");
        if(modal) modal.style.display = "flex";
        return;
    }

    const expertElement = document.querySelector('input[name="exp"]:checked');
    const expert = expertElement ? expertElement.value : "RED TEAM"; 
    const vaka = document.getElementById("vaka-select") ? document.getElementById("vaka-select").value : "-";
    const sector = document.getElementById("sector-select") ? document.getElementById("sector-select").value : "-";
    
    appendMsg("user", text || "Görsel Analiz Talebi");
    if(input) input.value = "";
    if(btn) {
        btn.disabled = true;
        btn.innerText = "RUNNING...";
    }

    // BİLDİRİMİ AÇMA
    document.getElementById('cassandra-status-area').style.display = 'flex';

    try {
        let base64Image = null;
        let finalPrompt = text; 
    
        // Dosya veya resim yükleme kontrolü
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 2 * 1024 * 1024) throw new Error("Dosya çok büyük (Maks 2MB)");
            
            if (file.type.match("text.*") || file.name.endsWith(".txt")) {
                const fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file); 
                });
                
                finalPrompt = finalPrompt 
                    ? `${finalPrompt}\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`
                    : `Lütfen şu dosya içeriğini analiz et:\n\n--- EKLENEN DOSYA İÇERİĞİ ---\n${fileContent}`;
            } 
            else {
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file); 
                });
            }
        }

        // --- ENGELE TAKILMAYAN DOĞRUDAN GROQ BAĞLANTISI ---
        // Kullanıcı resim yüklediyse Llama 4 Scout'un bayıldığı array yapısını kuruyoruz
        let messageContent;
        if (base64Image) {
            messageContent = [
                { type: "text", text: finalPrompt || "Lütfen bu siber güvenlik vakasını ve görseli analiz et." },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ];
        } else {
            messageContent = finalPrompt;
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${savedKey}`
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct", // Orijinal canavar modelin
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
                        content: messageContent
                    }
                ],
                temperature: 0.2,
                max_tokens: 2048
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Groq API Hatası: ${res.status}`);
        }
        
        const data = await res.json();
        const aiResponse = data.choices[0].message.content; // Doğrudan Groq'tan gelen cevabı okuyoruz

        if (!aiResponse) {
            throw new Error("Yapay zekadan geçerli bir analiz yanıtı alınamadı.");
        }

        const report = {
            reportId: Math.floor(Math.random() * 9000 + 1000),
            expert, 
            attackVector: vaka, 
            analysis: aiResponse,
            timestamp: new Date().toISOString()
        };
        
        // Ekrana basma ve geçmişe kaydetme fonksiyonları tetikleniyor
        appendMsg("assistant", aiResponse, `${expert} // CAS-${report.reportId}`, report);
        saveHistory(report);

    } catch (e) {
        appendMsg("assistant", `⚠️ Hata: ${e.message}`);
    } finally {
        // BİLDİRİMİ KAPATMA
        document.getElementById('cassandra-status-area').style.display = 'none';
        
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
        
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "msg-actions";
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn copy-btn";
        copyBtn.innerText = "COPY";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = "✔️";
            setTimeout(() => { copyBtn.innerText = "COPY"; }, 2000);
        };
        actionsDiv.appendChild(copyBtn);

        if(report) {
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

function deleteHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || "[]");
    history.splice(index, 1);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(history));
    renderHistory();
}

// 6. PDF ÇIKTISI
function downloadPdf(data) {
    if(typeof pdfMake === 'undefined') return alert("PDF modülü yüklenemedi.");

    const safeVakaName = data.attackVector.replace(/[\/\\?%*:|"<>]/g, '-'); 
    const fileName = `${safeVakaName} - CAS-${data.reportId}.pdf`;

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

// GİRİŞ EKRANI (MODAL) YÖNETİMİ
document.addEventListener("DOMContentLoaded", () => {
    const savedKey = localStorage.getItem("cassandra_groq_key");
    const modal = document.getElementById("apiKeyModal");
    
    if (!savedKey && modal) {
        modal.style.display = "flex";
    } else if (modal) {
        modal.style.display = "none";
    }
    // API Key kaydetme işlemi
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

// BAŞLATICILAR
window.onload = async () => { 
    initSystem(); 
    await loadScenarios(); 
    renderHistory(); 
};

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

// 7. PANO RESİM YAPIŞTIRMA DESTEĞİ
document.addEventListener('paste', (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (let index in items) {
        const item = items[index];
        
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
                console.log("📸 Resim panodan başarıyla eklendi!");
            }
        }
    }
});
