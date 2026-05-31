# DEPLOYMENT GUIDE

## Railway (Backend)
1. Konek GitHub repo ke Railway.
2. Tambahkan Environment Variable: 
   - \`TWELVEDATA_API_KEY\`
   - \`GEMINI_API_KEY\`
   - \`TELEGRAM_BOT_TOKEN\`
   - DLL.
3. Railway akan otomatis build menggunakan \`npm run build\` dan \`npm start\`.

## Vercel (Frontend)
1. Vercel akan membaca project Node.js.
2. Konfigurasi build \`npm run build\` dan \`dist\` sebagai Root Directory.

## Capacitor (Mobile Android)
1. Eksekusi script Capacitor:
   \`npm run build && npx cap sync\`
2. Buka Android Studio untuk build APK:
   \`npx cap open android\`
3. Generate signed APK via GUI atau gradle build CLI.
