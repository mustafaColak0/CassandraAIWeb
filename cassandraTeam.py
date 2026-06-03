import streamlit as st
import os
import base64
from crewai import Agent, LLM
from fpdf import FPDF
from datetime import datetime

# --- 1. GÜVENLİK PROTOKOLÜ ---
BACKUP_GROQ_KEY = st.secrets.get("GROQ_API_KEY", "")

# --- 2. GÖRSEL MİMARİ & KUSURSUZ İMLEÇ MANTIĞI ---
def apply_neon_matrix_theme():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght=500;700&family=JetBrains+Mono&display=swap');
        
        .stApp { background-color: #030712; color: #cbd5e1; font-family: 'Inter', sans-serif; }
        .block-container { padding-top: 2rem !important; padding-bottom: 4rem !important; }
        [data-testid="stSidebar"] { background-color: rgba(10, 15, 30, 0.98) !important; border-right: 2px solid #00d4ff; }
        h1, h2, h3 { color: #00d4ff !important; font-family: 'Rajdhani', sans-serif; text-transform: uppercase; text-shadow: 0 0 10px rgba(0, 212, 255, 0.4); }
        
        .stChatMessage { 
            background: rgba(15, 23, 42, 0.9) !important; 
            border: 1px solid rgba(0, 212, 255, 0.2) !important; 
            border-radius: 12px !important; 
            line-height: 1.4 !important; 
            margin-bottom: 0.5rem !important; 
            padding: 12px !important; 
            max-height: 550px; 
            overflow-y: auto; 
        }

        .stButton>button { 
            background: rgba(0, 212, 255, 0.05); 
            color: #00d4ff; 
            border: 1px solid #00d4ff; 
            font-family: 'Rajdhani', sans-serif; 
            font-weight: 700; 
            transition: 0.3s all ease; 
            width: 100%; 
            cursor: pointer !important; 
        }
        
        /* --- CASSANDRA PRECISION CURSOR PROTOCOL --- */
        div[data-testid="stSelectbox"] div[data-baseweb="select"] > div:first-child { cursor: text !important; }
        div[data-testid="stSelectbox"] svg { cursor: pointer !important; }
        div[data-testid="stRadio"] label [data-testid="stMarkdownContainer"] p { cursor: text !important; }
        div[data-testid="stRadio"] label div[role="radiogroup"] div,
        div[data-testid="stRadio"] input[type="radio"] + div { cursor: pointer !important; }
        div[data-testid="stRadio"] label { cursor: pointer !important; }
        [data-testid="stChatInputTextArea"], textarea, input[type="text"] { cursor: text !important; }
        div[data-baseweb="popover"] li { cursor: pointer !important; }
        [data-testid="stChatInput"] { border: 1px solid #00d4ff !important; background-color: #0f172a !important; }
        hr { margin: 0.5rem 0 !important; }
        </style>
    """, unsafe_allow_html=True)

st.set_page_config(page_title="CASSANDRA // FINAL PROTOCOL", page_icon="🛡️", layout="wide")
apply_neon_matrix_theme()

# --- 3. RAPORLAMA MOTORU ---
def clean_pdf_text(text):
    table = str.maketrans("ğĞıİöÖüÜşŞçÇ", "gGiIoOuUsScC")
    return text.translate(table).replace("**", "").replace("###", "").replace("#", "").encode('ascii', 'ignore').decode('ascii')

class CassandraReport(FPDF):
    def header(self):
        self.set_fill_color(3, 7, 18)
        self.rect(0, 0, 210, 40, 'F')
        self.set_y(15)
        self.set_font('Arial', 'B', 16)
        self.set_text_color(0, 212, 255)
        self.cell(0, 10, 'CASSANDRA AI | STRATEGIC INTEL REPORT', 0, 1, 'C')

def get_download_link(pdf_data, filename):
    b64 = base64.b64encode(pdf_data).decode()
    return f'<div style="text-align: center; margin-top: 20px;"><a href="data:application/pdf;base64,{b64}" download="{filename}" style="text-decoration: none; background-color: #00d4ff; color: #000; padding: 15px 30px; border-radius: 5px; font-weight: bold; box-shadow: 0 0 15px #00d4ff; font-family: Rajdhani;">📥 ANALİZ RAPORUNU İNDİR</a></div>'

# --- 4. DATA HAVUZU & VAKA SENARYOLARI ---
SCENARIOS = {
    "🚩 CTF Challenge Arena": [
        "Web: IDOR & Logic Vulnerabilities",
        "Pwn: Buffer Overflow Basics",
        "Crypto: RSA & Classical Ciphers",
        "Forensics: Memory Dump Analysis",
        "Reverse: Simple Malware Crackme"
    ],
    "🌐 OWASP Top 10 & Temel Zafiyetler": [
        "A01: Broken Access Control (Yetki Aşımı)",
        "A02: Cryptographic Failures (Şifreleme Hataları)",
        "A03: Injection (SQLi, NoSQL, OS Command)",
        "A04: Insecure Design (Güvensiz Tasarım)",
        "A05: Security Misconfiguration (Hatalı Yapılandırma)",
        "A06: Vulnerable and Outdated Components",
        "A07: Identification and Authentication Failures",
        "A08: Software and Data Integrity Failures",
        "A09: Security Logging and Monitoring Failures",
        "A10: SSRF (Server-Side Request Forgery)",
        "XSS (Cross-Site Scripting) - Stored/Reflected",
        "CSRF (Cross-Site Request Forgery)"
    ],
    "🕵️ Efsanevi & Gizli Operasyonlar": [
        "Stuxnet: Endüstriyel Sabotaj", 
        "Operation Cupcake: MI6 vs Al-Qaeda", 
        "The Morris Worm: Tarihin İlk Virüsü", 
        "SolarWinds: Tedarik Zinciri İhaneti",
        "Equation Group: NSA'in Hayalet Araçları",
        "Operation Aurora: Google vs APT1",
        "Kidnap the Gentlemen: VIP Fidye Operasyonu",
        "Cruise Control: Otonom Araç Sabotajı"
    ],
    "🤖 AI & LLM Savaşları": [
        "Direct Prompt Injection", 
        "Indirect Prompt Injection", 
        "AI Agent Jailbreaking", 
        "Prompt Leaking",
        "Training Data Poisoning",
        "Model Inversion (Veri Geri Kazanımı)",
        "AI Hallucination Exploitation",
        "Adversarial Machine Learning Attacks"
    ],
    "🌐 Web & Ağ Sızmaları": [
        "Advanced SQL Injection", 
        "Ransomware Workflow (LockBit/Conti)", 
        "Zero-Day Attack Discovery",
        "BGP Hijacking (Trafik Yönlendirme)",
        "DNS Tunneling (Gizli Veri Çıkışı)",
        "SSRF (Server-Side Request Forgery)",
        "Golden Ticket (Kerberos) Saldırısı",
        "Man-in-the-Middle (MitM) Operations"
    ],
    "🔌 IoT, Donanım & Endüstriyel (OT)": [
        "IoT Botnet Formation (Mirai Style)", 
        "Smart Home Hijacking",
        "PLC Ladder Logic Sabotage",
        "Firmware Backdoor Injection",
        "Side-Channel Attacks (Spectre/Meltdown)",
        "BadUSB / Rubber Ducky Attacks",
        "SCADA / Power Grid Sabotage",
        "BlueBorne: Bluetooth Vulnerabilities",
        "Hardware Keylogging"
    ],
    "📱 Mobil & Sosyal Mühendislik": [
        "Pegasus Style Spyware Analysis", 
        "SIM Swapping Operations",
        "Deepfake Vishing (Sesli Dolandırıcılık)",
        "AiTM (Adversary-in-the-Middle) Phishing",
        "Whaling (CEO Fraud) Attack",
        "Juice Jacking (Şarj İstasyonu Sızması)",
        "Evil Twin (Sahte Wi-Fi Hotspot)"
    ],
    "🛸 Egzotik & Gelecek Nesil": [
        "Quantum Computing vs RSA Encryption",
        "Satellite Hijacking (Uydu Ele Geçirme)",
        "Bio-Hacking (Medikal Cihaz Sızmaları)",
        "Cryptojacking (Gizli Madencilik)",
        "Steganography (Görsel İçine Veri Saklama)",
        "EMSEC / Tempest (Sinyal İzleme)"
    ],
    "💼 Kurumsal Casusluk & APT": [
        "Insider Threat (İçerideki Köstebek)",
        "Corporate Espionage (Ticari Casusluk)",
        "Data Exfiltration (DNS/ICMP Tunneling)",
        "Supply Chain Poisoning",
        "Honeytoken Triggering & Detection",
        "Living off the Land (LotL) Attacks"
    ]
}

# --- 5. SIDEBAR ---
with st.sidebar:
    st.markdown("<h2 style='text-align: center;'>⚡ OPS CENTER</h2>", unsafe_allow_html=True)
    st.divider()
    
    # 🔑 DINAMIK API KEY GIRISI
    st.markdown("### 🔑 GROQ API KEY:")
    user_api_key = st.text_input(
        "Kendi Groq API anahtarınızı girin:", 
        type="password", 
        value=st.session_state.get("custom_api_key", BACKUP_GROQ_KEY),
        placeholder="gsk_...",
        label_visibility="collapsed"
    )
    
    if user_api_key:
        st.session_state["custom_api_key"] = user_api_key
        os.environ["GROQ_API_KEY"] = user_api_key
    
    st.divider()
    
    st.markdown("### 📂 Analiz İçin Dosya Yükle:")
    uploaded_file = st.file_uploader("", type=['png', 'jpg', 'pdf', 'txt', 'pcap'], label_visibility="collapsed")
    
    if uploaded_file is not None:
        st.success(f"✅ {uploaded_file.name} Yüklendi")
    
    st.divider()
    
    category = st.selectbox("Sektör Seç:", list(SCENARIOS.keys()))
    attack_vector = st.selectbox("Vaka Seç:", SCENARIOS[category])
    expert = st.radio("Analist:", ["Red Team Expert", "Blue Team Responder", "Chief Strategist"])

# --- 6. ANA AKIŞ VE ANALİZ ---
st.markdown("<h1>🛡️ CASSANDRA // STEALTH OPS</h1>", unsafe_allow_html=True)

if "messages" not in st.session_state: st.session_state.messages = []
if "last_resp" not in st.session_state: st.session_state.last_resp = ""

for m in st.session_state.messages:
    with st.chat_message(m["role"]): st.markdown(m["content"])

# Güvenlik Kontrolü
if not st.session_state.get("custom_api_key"):
    st.warning("⚠️ SİSTEM BLOKE: İşlem yapabilmek için lütfen sol menüden (OPS CENTER) geçerli bir GROQ API KEY giriniz 🔑")
else:
    my_llm = LLM(
        model="groq/llama-3.1-8b-instant", 
        api_key=st.session_state["custom_api_key"], 
        temperature=0.2, 
        max_tokens=1500
    )

    if prompt := st.chat_input("Talimatlar..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        sys_prompt = f"ROL: {expert} | VAKA: {attack_vector} | GÖREV: {prompt} talebini analiz et."

        with st.chat_message("assistant"):
            try:
                response = my_llm.call([{"role": "user", "content": sys_prompt}])
                st.markdown(response)
                st.session_state.last_resp = response
                st.session_state.messages.append({"role": "assistant", "content": response})
            except Exception as e:
                st.error(f"API Anahtarı Geçersiz veya Sistem Hatası: {e}")
        st.rerun()

# --- 7. RAPOR ÇIKTISI ---
if st.session_state.last_resp:
    pdf = CassandraReport()
    pdf.add_page()
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 8, clean_pdf_text(st.session_state.last_resp))
    pdf_bytes = pdf.output(dest='S').encode('latin-1')
    report_filename = f"CAS_{attack_vector.replace(' ', '_')}.pdf"
    st.markdown(get_download_link(pdf_bytes, report_filename), unsafe_allow_html=True)