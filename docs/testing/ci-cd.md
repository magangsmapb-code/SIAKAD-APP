# 🚀 PANDUAN CI/CD & PENGUJIAN OTOMATIS
## SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
*Versi Dokumen: 1.0.0 | Terakhir Diperbarui: 21 Oktober 2026*

---

### 1. Arsitektur Pipeline CI/CD GitHub Actions

Repositori SIAKAD dilengkapi dengan pipeline integrasi berkelanjutan (*Continuous Integration*) otomatis yang dikonfigurasi pada berkas [`.github/workflows/ci.yml`](file:///c:/xampp/htdocs/SIAKAD%20APP/.github/workflows/ci.yml).

Pipeline berjalan secara otomatis pada:
- Setiap `push` ke branch utama (`main`, `master`, `develop`).
- Setiap `pull_request` yang diajukan ke branch utama.
- Fitur pembatalan otomatis (*concurrency cancellation*) untuk mencegah pemborosan runner saat terjadi push beruntun.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS CI PIPELINE                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   web-nextjs    │       │   api-nestjs    │       │  mobile-flutter │
│                 │       │                 │       │                 │
│ • npm ci        │       │ • npm ci        │       │ • Java 17 Setup │
│ • ESLint check  │       │ • Prisma Valid  │       │ • Flutter 3.47  │
│ • Typecheck     │       │ • Isolated PG16 │       │ • flutter pub   │
│ • Next.js Build │       │ • Jest Unit/Int │       │ • flutter check │
│                 │       │ • NestJS Build  │       │ • flutter test  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

### 2. Panduan Eksekusi Pengujian Lokal (Local Testing Guide)

Sebelum melakukan `git push` atau membuka Pull Request, seluruh pengembang wajib menjalankan pengujian lokal berikut pada mesin pengembangan:

#### A. Pengujian Frontend Website (Next.js 15)
Direktori kerja: root repositori (`./`)
```powershell
# 1. Validasi Linter ESLint (0 errors, 0 warnings wajib)
npm run lint

# 2. Pengecekan Ketat Tipe Data TypeScript
npm run typecheck

# 3. Kompilasi Bundel Produksi (Memastikan 16 rute statis sukses ter-generate)
npm run build
```

#### B. Pengujian Backend API (NestJS 10)
Direktori kerja: `apps/api/`
```powershell
cd "c:\xampp\htdocs\SIAKAD APP\apps\api"

# 1. Validasi Sintaks Skema Prisma
npx prisma validate

# 2. Eksekusi Test Suite Jest Lengkap (28 unit & integration tests)
npm test

# 3. Eksekusi Test Suite dengan Laporan Cakupan Kode (Code Coverage)
npm run test:cov

# 4. Kompilasi Bundel Produksi NestJS
npm run build
```

#### C. Pengujian Mobile App (Flutter & Dart)
Direktori kerja: `apps/mobile/`
```powershell
cd "c:\xampp\htdocs\SIAKAD APP\apps\mobile"

# 1. Unduh Dependensi Pub
& "..\..\Flutter\flutter\bin\flutter.bat" pub get

# 2. Analisis Statis Kode Dart (Wajib: No issues found)
& "..\..\Flutter\flutter\bin\flutter.bat" analyze --no-fatal-infos

# 3. Eksekusi Seluruh Widget & Unit Test (17/17 passed)
& "..\..\Flutter\flutter\bin\flutter.bat" test
```

---

### 3. Cara Membaca Hasil Eksekusi GitHub Actions

Setiap commit atau PR akan menampilkan ikon status pada tab **Actions** di GitHub:

1. **Simbol Centang Hijau (✔ Pass)**:
   - Seluruh tahapan linter, tipe data, pengujian unit, migrasi basis data terisolasi, dan build produksi berhasil 100%.
   - Kode aman untuk ditinjau dan digabungkan (*safe to merge*).
2. **Simbol Silang Merah (✖ Fail)**:
   - Salah satu pekerjaan mengalami kegagalan. Klik nama job yang gagal untuk melihat log detail pada step terkait.
3. **Simbol Kuning Berputar (● Running)**:
   - Pekerjaan sedang dieksekusi oleh GitHub Hosted Runner.

---

### 4. Prosedur Penanganan Pipeline Gagal (Troubleshooting Runbook)

| Gejala Kegagalan CI | Kemungkinan Penyebab | Tindakan Resolusi Cepat |
| :--- | :--- | :--- |
| **`npm ci` gagal di step Install Dependencies** | `package-lock.json` tidak sinkron dengan `package.json`. | Jalankan `npm install` lokal, pastikan `package-lock.json` ter-commit bersamaan. |
| **`npm run typecheck` gagal** | Terjadi ketidaksesuaian tipe data TypeScript (`strict: true`). | Periksa baris file yang dilaporkan compiler, jalankan `npm run typecheck` lokal hingga exit code 0. |
| **`npx prisma validate` / db push gagal** | Skema Prisma memiliki relasi yang bentrok atau syntax error. | Jalankan `npx prisma validate` dan pastikan nama relasi foreign key valid. |
| **`Jest test` gagal pada `attendance.service.spec.ts`** | Mock object Prisma tidak menyediakan fungsi yang dipanggil service. | Periksa apakah service memanggil `findFirst` vs `findUnique`, atau ada validasi baru yang membutuhkan mock data. |
| **`flutter analyze` menghasilkan error** | Terdapat unused import atau type error pada Dart. | Jalankan `flutter analyze` lokal dan perbaiki kode sebelum push. |
| **`Build Flutter APK` kehabisan memori** | Memori Java/Gradle runner tidak mencukupi. | CI telah dikonfigurasi dengan opsi `--debug --dart-define=DEMO_MODE=false` yang hemat memori. |

---

### 5. Kebijakan Keamanan CI/CD (Security Policies)

1. **Isolasi Basis Data Penuh**: CI backend menggunakan kontainer Docker ephemeral `postgres:16-alpine` terpisah. CI **TIDAK PERNAH** terhubung ke database staging atau produksi sekolah.
2. **Perlindungan Kredensial**: Tidak ada password, token otorisasi, atau kunci rahasia yang dicetak ke log build.
3. **No Automatic Production Deployment**: Pipeline dibatasi pada tahap verifikasi (Build & Test). Rilis produksi ke server sekolah memerlukan persetujuan eksplisit melalui proses manual.
