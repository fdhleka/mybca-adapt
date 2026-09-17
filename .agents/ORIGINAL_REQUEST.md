# Original User Request

## Initial Request — 2026-09-11T14:17:05Z

Sistem simulasi fullstack interaktif end-to-end untuk myBCA ADAPT yang mencakup alur lengkap perbankan mulai dari halaman Login otentik myBCA (BCA ID multi-akun), backend server lokal dengan database persisten, hingga dashboard adaptif yang reaktif bergerak menyesuaikan seluruh data dan algoritma AI.

Working directory: C:\Users\irul2\Downloads\Bahan YNFest
Integrity mode: demo

## Requirements

### R1. Halaman Login Otentik & Autentikasi Multi-Akun myBCA
- Mengimplementasikan halaman Login myBCA otentik berbasis template dan styling asli (full-website-code.html & combined-styles-komplit.css).
- Menyediakan form input BCA ID dan Password, dilengkapi dengan "Quick Switcher / Auto-fill Persona Helper" di pojok agar juri/penguji dapat langsung masuk ke akun persona manapun dengan 1 klik tanpa repot.
- Sistem sesi/token login yang mengarahkan user ke dashboard pribadi persona yang bersangkutan, serta tombol Logout fungsional untuk berganti akun.

### R2. Arsitektur Backend & Database Persisten (Local Fullstack)
- Server backend ringan (Node.js/Express) dengan database persisten (SQLite/JSON relational store).
- Schema database mencakup tabel: users/personas (BCA ID, profil, level), accounts (nomor rekening, saldo), transactions (mutasi histori multi-periode), user_features (status fitur aktif), dan life_events (history deteksi sinyal).
- Dilengkapi endpoint/fitur "Reset Database to Initial Seeds" dengan 1 klik agar state demonstrasi bisa di-reset sewaktu-waktu di depan juri.

### R3. Dashboard Reaktif & Adaptasi Menyeluruh
- Begitu user login, seluruh tampilan halaman utama myBCA beradaptasi secara dinamis dan bergerak sesuai data akun persona tersebut (nama nasabah, nomor rekening, saldo, transaksi terakhir).
- Semua komponen terhubung secara reaktif ke database backend (bukan teks statis dummy).

### R4. Engine 3 Algoritma AI myBCA ADAPT (Live Recalculation)
- Algoritma 1 (Personalisasi Transaksi): Menghitung propensity match score per fitur berdasarkan frekuensi & nominal transaksi di database akun aktif. Menampilkan rekomendasi fitur terkontekstual dengan opsi aktivasi 1-klik.
- Algoritma 2 (Life Event Detection & Smart Bundling): Menganalisis pergeseran pola transaksi baseline vs periode berjalan di database. Memicu modal/banner penawaran bundle hidup baru (cth: Mulai Kerja Kit, Rumah Tangga Baru Kit, Pro Merchant Kit) saat confidence score >= 60%.
- Algoritma 3 (Gamifikasi Skor Kesehatan Finansial): Menghitung skor terbobot 0-100 secara dinamis dari database, memetakan ke badge tier (Bronze/Silver/Gold/Diamond), dan memperbarui skor secara live saat fitur diaktifkan.

### R5. Interactive Simulation Lab & Data Injector
- Form input transaksi/mutasi baru yang benar-benar tersimpan ke database akun persona, memicu pembaruan saldo dan memicu recalculation otomatis pada ketiga engine algoritma.
- Panel "Audit Engine Inspector (Mode Juri)" yang dapat dibuka-tutup untuk melihat formula matematika dan live trace log keputusan AI.

## Acceptance Criteria

### User Flow & Authentication
- [ ] Pengguna diarahkan ke halaman Login myBCA saat pertama kali membuka aplikasi.
- [ ] Tersedia minimal 5 persona lengkap di database (Dimas - Fresh Grad, Ayu - Newlywed, Sari - Merchant/Bisnis, Rina - Mahasiswa, Bambang - Pensiun) dan dapat di-login via form maupun quick-login helper.
- [ ] Tombol Logout berhasil mengembalikan sesi ke halaman login.
- [ ] Tombol Reset Database mengembalikan seluruh mutasi dan fitur ke kondisi awal seed.

### Dynamic Reactivity & Simulation
- [ ] Login dengan akun berbeda menampilkan data yang berbeda 100% (saldo, mutasi, level gamifikasi, dan rekomendasi).
- [ ] Menginput transaksi manual baru pada akun yang aktif langsung tersimpan di database dan mengubah saldo serta grafik/daftar transaksi.
- [ ] Menambahkan transaksi dengan sinyal life event (cth: Gaji + Sewa Kos) secara otomatis memicu banner Smart Bundling yang sesuai.
- [ ] Mengaktifkan fitur atau bundle dari antarmuka langsung mengupdate database dan menaikkan Gamification Score secara real-time.
