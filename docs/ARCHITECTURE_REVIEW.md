# ARCHITECTURE REVIEW

## 1. COMPARISON DENGAN PRD

### FRONTEND
- **PRD:** React 19, TailwindCSS, Shadcn UI, Capacitor Android.
- **Validasi:** Project sudah menggunakan React 19 dan TailwindCSS. Shadcn UI akan di-setup menggunakan CLI resmi. Capacitor akan ditempel di atas struktur Vite setelah UI selesai. Arsitektur Frontend sesuai.

### BACKEND
- **PRD:** Python 3.12, Flask, Gunicorn, APScheduler.
- **Validasi:** Repository saat ini adalah Node.js base. Kebutuhan build/run secara nyata di AI Studio memblokir execution server Python. Namun, secara arsitektur direktori, kita akan membuat folder `/backend` dengan struktur Flask yang siap pakai untuk Railway (`app.py`, `requirements.txt`, `Procfile`).

### DATABASE (FIRESTORE)
- **PRD:** Collection `signals` (menyimpan history signal) dan `system` (menyimpan metadata/koneksi).
- **Validasi:** Mengingat arsitektur backend Python berjalan di mesin yang terpisah dari frontend, Firebase Admin SDK (Python) wajib digunakan di backend, sementara frontend (opsional) menggunakan Firebase Client SDK untuk read data dashboard.

### EXTERNAL SERVICES
- **PRD:** TwelveData (Current Price/OHLC), Yahoo Finance (Fallback), NewsAPI/GNews (Filter Berita), Gemini 1.5 Flash (Verifikator), Telegram Bot (Notifikasi).
- **Validasi:** Arsitektur API pihak ketiga ini akan dikonsolidasi di satu layer "Engine" pada Backend untuk menghindari logic yang bocor ke frontend. Fetch data via HTTP (Requests library di Python).

### ENVIRONMENT VARIABLES
- **PRD:** Daftar env keys untuk API dan database.
- **Validasi:** Di AI Studio tidak akan dijalankan auto-trading, namun "Analisis", "Validasi", dan "Signal" perlu keys. Variabel akan ditempatkan di `.env.example` frontend/backend. 

## 2. KESIMPULAN ARSITEKTUR
Keseluruhan arsitektur yang direncanakan di PRD terbukti fisibel. Fokus implementasi:
1. Pembangunan **Engine Module** (Market, BOS, CHOCH, FVG, Fibonacci, ATR, Killzone, News, Validasi AI, Confidence).
2. Pembangunan scheduler `APScheduler`.
3. Komunikasi Firebase Firestore yang tersentralisasi.
4. Eksposur REST API Endpoint (sesuai Contract).

Review selesai. Siap melangkah ke Phase 3.
