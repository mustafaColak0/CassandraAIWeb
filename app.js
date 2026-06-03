let scenarios = {};
const CHAT_SESSIONS_KEY = "cassandra_soc_history_v4";
const BACKEND_BASE_URL = "https://cassandra-ai-backend.onrender.com"; 

// 1. SİSTEM BAŞLATICISI
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
        const expVal = expEl ? expEl.value.split(' ')[0].toUpperCase() : "RED";
        
        if(document.getElementById("display-sector")) document.getElementById("display-sector").textContent = secVal;
        if(document.getElementById("display-vaka")) document.getElementById("display-vaka").textContent = vakVal;
        if(document.getElementById("display-analyst")) document.getElementById("display-analyst").textContent = expVal;
    };

    document.getElementById("sector-select")?.addEventListener("change", updateDisplay);
    document.getElementById("vaka-select")?.addEventListener("change", updateDisplay);
    document.querySelectorAll('input[name="exp"]').forEach(r => r.addEventListener("change", updateDisplay));
    
    const histBtn = document.getElementById("history-toggle-btn");
    if(histBtn) {
        histBtn.onclick = () => {
            const histContent = document.getElementById("history-content");
            if(histContent) histContent.classList.toggle("active");
        };
    }
    
    const clearBtn = document.getElementById("clear-history-btn");
    if(clearBtn) {
        clearBtn.onclick = () => {
            if(confirm("Tüm geçmiş silinecek. Emin misin?")) {
                localStorage.removeItem(CHAT_SESSIONS_KEY);
                renderHistory();
            }
        };
    }
    setTimeout(updateDisplay, 500);
}

// 2. SENARYO YÜKLEME
async function loadScenarios() {
    const fallbacks = {
        "Ağ Güvenliği": ["Port Tarama", "DDoS Analizi"],
        "Web Uygulama": ["SQL Injection", "XSS", "IDOR"]
    };

    try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/scenarios`);
        const data = await res.json();
        scenarios = (data.scenarios && Object.keys(data.scenarios).length > 0) ? data.scenarios : fallbacks;
    } catch (err) { 
        console.error("Yedek senaryolar devrede:", err);
        scenarios = fallbacks; 
    }
    
    const sector = document.getElementById("sector-select");
    const vaka = document.getElementById("vaka-select");
    if(!sector || !vaka) return;
    
    sector.innerHTML = Object.keys(scenarios).map(s => `<option value="${s}">${s}</option>`).join("");
    sector.onchange = () => {
        if(scenarios[sector.value]) {
            vaka.innerHTML = scenarios[sector.value].map(v => `<option value="${v}">${v}</option>`).join("");
        }
    };
    sector.onchange();
}

// 3. ANALİZİ ÇALIŞTIRMA
async function runAnalysis() {
    const input = document.getElementById("prompt-in");
    const btn = document.getElementById("analyze-btn");
    const fileInput = document.getElementById("file-input");
    
    if(!input || !btn) return; 
    
    const text = input.value.trim();
    if(!text && (!fileInput || !fileInput.files[0])) return;
    
    const expertElement = document.querySelector('input[name="exp"]:checked');
    const expert = expertElement ? expertElement.value : "RED TEAM"; 
    const vaka = document.getElementById("vaka-select")?.value || "-";
    const sector = document.getElementById("sector-select")?.value || "-";
    
    let userMsgHTML = text || "";
    if (fileInput && fileInput.files[0]) {
        userMsgHTML += userMsgHTML ? `<br>📁 <i>Eklenti: ${fileInput.files[0].name}</i>` : `📁 <i>Dosya: ${fileInput.files[0].name}</i>`;
    }
    appendMsg("user", userMsgHTML);

    input.value = "";
    btn.disabled = true;
    btn.innerHTML = "RUNNING...";

    try {
        let base64Image = null;
        let finalPrompt = text; 
    
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.type.match("text.*") || file.name.endsWith(".txt") || file.name.endsWith(".log")) {
                const fileContent = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsText(file, "UTF-8");
                });
                finalPrompt = `${finalPrompt}\n\n[DOSYA İÇERİĞİ]:\n${fileContent}`;
            } else if (file.type.match("image.*")) {
                base64Image = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(file); 
                });
            }
        }

        const userKey = localStorage.getItem("cassandra_api_key");

        const res = await fetch(`${BACKEND_BASE_URL}/api/analyze`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ 
                prompt: finalPrompt, 
                expert: expert, 
                attackVector: vaka,
                sector: sector,
                image: base64Image,
                userApiKey: userKey 
            })
        });
        
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Hata oluştu.");

        const report = {
            reportId: data.reportId || Math.floor(Math.random()*9000+1000),
            expert, 
            attackVector: vaka, 
            analysis: data.analysis,
            timestamp: new Date().toISOString()
        };

        appendMsg("assistant", data.analysis, `${expert} // CAS-${report.reportId}`, report);
        saveHistory(report);

    } catch (e) {
        appendMsg("assistant", `⚠️ Hata: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = "ANALYZE";
        if(fileInput) fileInput.value = "";
        input.focus();
    }
}

// 4. MESAJ EKLEME
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
            <div class="msg-head">
                <span class="expert-tag">${meta}</span>
            </div>
            <div class="msg-body">${cleanText}</div>
        `;
        
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "msg-actions";
        
        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn";
        copyBtn.innerText = "COPY";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerText = "✔️";
            setTimeout(() => copyBtn.innerText = "COPY", 2000);
        };
        actionsDiv.appendChild(copyBtn);
        div.appendChild(actionsDiv);
    }
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
}

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
}

// ETKİLEŞİMLER
window.onload = async () => { 
    initSystem(); 
    await loadScenarios(); 
    renderHistory(); 
};

if(document.getElementById("analyze-btn")) {
    document.getElementById("analyze-btn").onclick = runAnalysis;
}

const promptIn = document.getElementById("prompt-in");
if(promptIn) {
    promptIn.onkeydown = (e) => { 
        if(e.key === "Enter") { e.preventDefault(); runAnalysis(); }
    };
}