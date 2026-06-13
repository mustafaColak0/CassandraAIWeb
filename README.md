# 🛡️ Cassandra AI - Advanced Cyber Security SOC Assistant

Cassandra AI, siber güvenlik vakalarını, saldırı vektörlerini ve log dosyalarını yapay zeka desteğiyle analiz eden gelişmiş bir **Siber Operasyon Merkezi (SOC) Asistanı** ve simülasyon platformudur. Çoklu uzman rolü (Multi-Agent) desteği ve görsel analiz yeteneği sayesinde siber tehditleri farklı sektör perspektiflerinden değerlendirerek stratejik ve teknik raporlar üretir.

### 🌐 Canlı Önizleme / Live Demo
Projenin web arayüzünü canlı ortamda test etmek ve deneyimlemek için aşağıdaki bağlantıyı kullanabilirsiniz:
👉 **[Cassandra AI Web Interface](https://mustafacolak0.github.io/CassandraAIWeb/)**

<img width="800" height="362" alt="Cass-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/4c855629-06e2-4c38-8390-c7cdd7a6d363" />


---

## 🚀 Öne Çıkan Özellikler (Core Features)

* **🔑 Dinamik API Yönetimi:** Sunucu tarafında tek bir anahtara bağımlı kalmadan, kullanıcıların kendi API anahtarlarıyla (Groq / OpenAI) sistemi güvenli ve izole bir şekilde kullanmasını sağlar.
* **👥 Çoklu Uzman Simülasyonu (Multi-Expert System):** Tehditleri; *Red Team*, *Blue Team*, *Threat Intelligence*, *Forensics* gibi farklı siber güvenlik disiplinlerinin perspektifinden analiz eder.
* **📸 Görsel ve Dosya Analizi:** Ekran görüntülerini (panodan direkt yapıştırma desteğiyle) veya teknik `.txt` log dosyalarını sisteme yükleyerek anında derinlemesine analiz gerçekleştirebilirsiniz.
* **🔄 Rol Bazlı Paslaşma (Dynamic Delegation):** Bir uzmanın ürettiği analiz çıktısını, tek tıkla otomatik olarak başka bir uzmana paslayıp ardışık (chain) analiz zinciri oluşturabilirsiniz.
* **📄 Stratejik PDF Raporlama:** Analiz edilen vakaları, kurumsal siber güvenlik standartlarına uygun keskin hatlı ve kurumsal tasarımlı **Strategic Intel Report (PDF)** dosyasına dönüştürür.
* **📜 SOC Geçmiş Modülü:** Geçmişte yapılan tüm analizleri `localStorage` üzerinde şifreli/güvenli bir şekilde arşivler ve istendiğinde panale geri yükler.

---

## 🛠️ Kullanılan Teknolojiler (Tech Stack)

* **Backend:** Node.js, Express.js, Cors, Dotenv
* **AI SDK:** Groq SDK, OpenAI API Integration
* **Frontend:** Modern HTML5, Cyberpunk/Dark UI CSS3, Vanilla JavaScript (ES6+)
* **Reporting:** pdfMake (İstemci taraflı dinamik PDF motoru)

---

## 📦 Kurulum ve Çalıştırma (Installation)

### 1. Gereksinimler
Sisteminizde **Node.js** (v16 veya üzeri) kurulu olmalıdır

### 2. Projeyi Klonlayın veya İndirin
```bash
git clone [https://github.com/mustafaColak0/cassandra-ai.git](https://github.com/mustafaColak0/cassandra-ai.git)
cd cassandra-ai
```

### 3. Bağımlılıkları Yükleyin
```
npm install
```
### 4. Sistemi Başlatın
```
npm start
```
Uygulama başarıyla ayağa kalktığında tarayıcınızdan http://localhost:3000 adresine giderek operasyon merkezini aktif edebilirsiniz.

🔒 Güvenlik ve Gizlilik (Security Notice)
Bu proje BYOK (Bring Your Own Key) mimarisine sahiptir. Girdiğiniz API anahtarları hiçbir şekilde üçüncü taraf sunuculara veya veritabanlarına kaydedilmez; tamamen tarayıcınızın güvenli yerel hafızasında (localStorage) tutulur ve doğrudan ilgili AI API'sine TLS/SSL üzerinden şifreli olarak iletilir.

📄 Lisans (License)
This project is licensed under the MIT License.
