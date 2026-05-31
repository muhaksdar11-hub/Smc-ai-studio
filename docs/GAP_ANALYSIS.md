# GAP ANALYSIS

## 1. PLATFORM CONSTRAINTS VS PRD REQUIREMENTS
- **Backend Stack:** 
  - **PRD:** Python 3.12, Flask, Gunicorn, APScheduler.
  - **Platform AI Studio:** Terbatas pada eksekusi Node.js (Express) di Port 3000. Command shell `python3` diblokir. 
  - **Gap Resolution:** Kami akan mensimulasikan behaviour backend di lingkungan pengembangan ini menggunakan Express.js dan `node-cron` untuk testing lokal (di AI Studio preview), namun struktur folder dan kode Python untuk Railway (sesuai spesifikasi) akan tetap dibuat di dalam folder `backend/` agar siap di-deploy ke Railway.
  
- **Firebase & Credentials:**
  - **PRD:** Firebase Firestore direferensikan melalui credential json file. 
  - **Platform AI Studio:** File credential akan kita load via Environment Variables atau via mock init pada preview, namun format credentials akan disiapkan agar Railway bisa mendeteksinya.

- **Mobile (Capacitor):**
  - **PRD:** Build APK lokal/Codemagic.
  - **Platform AI Studio:** Tidak dapat melakukan build APK (perintah native Android SDK tidak tersedia). Capacitor file config `capacitor.config.ts` dan integrasi initial akan disiapkan, namun build final harus dilakukan di mesin lokal pengguna atau platform CI/CD.

## 2. API AVAILABILITY
- **Data Market API (TwelveData & Yahoo Finance):**
  Membuka koneksi Outbound ke API eksternal diperbolehkan di platform. Kami harus membungkus logic fetcher sedemikian rupa sehingga failover ke Yahoo Finance tetap bekerja jika TwelveData terkena 429 Rate Limit.
  
## 3. SCHEDULE & DAEMON
- **PRD:** `APScheduler` dengan interval 60 detik.
- **Platform:** Daemon tidak direkomendasikan berjalan selamanya di agent environment yang idle, tapi karena requirement adalah interval 60 detik, hal ini tetap bisa dicapai menggunakan thread background `node-cron` di server Node.js saat dev server start, atau Python job di deployment asli.

## 4. KESIMPULAN
Gap terbesar adalah ketidakmampuan platform merepresentasikan environment server Python secara native. Solusinya:
1. Menulis kodestruktur lengkap untuk Python (Flask) di `/backend`.
2. Menyediakan dummy/bypass logic Node.js Express hanya untuk melayani Frontend di environment AI Studio sehingga UI dapat di tes.
3. Tetap menggunakan data real (bukan mock) dengan melewatinya via proxy Node/Python.

Atau, kami merekomendasikan transisi total ke Node.js Express (Typescript) menggunakan `node-cron` agar sistem dapat di-run dan dimonitor langsung di dalam AI Studio secara utuh tanpa modifikasi lanjutan. Untuk tugas ini, fokus pertama adalah penyesuaian infrastruktur.
