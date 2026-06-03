const SCENARIOS = {
  "🚩 CTF Challenge Arena": [
    "Web: IDOR & Logic Vulnerabilities",
    "Pwn: Buffer Overflow Basics",
    "Crypto: RSA & Classical Ciphers",
    "Forensics: Memory Dump Analysis",
    "Reverse: Simple Malware Crackme",
    "OSINT: WHOIS, DNS & Reconnaissance",
    "Forensics: Metadata & File Signature Analysis",
    "Forensics: PCAP & Network Traffic Analysis",
    "Threat Intel: False Flag Operations"
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
    "Living off the Land (LotL) Attacks",
    "Threat Intelligence: Attribution & False Flag Ops",
    "Log Analysis & Incident Response (IR)"
  ],
  "🔍 OSINT & Tehdit İstihbaratı": [
    "Domain & DNS Footprinting",
    "Social Media Intelligence (SOCMINT)",
    "Document Forensics & Metadata",
    "Threat Actor Attribution (Saldırgan Profilleme)",
    "False Flag Operations (Sahte Bayrak)",
    "Dark Web & Leak Investigation"
  ]
};  
module.exports = { SCENARIOS };
