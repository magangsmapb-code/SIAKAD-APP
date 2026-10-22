# 🔒 KEBIJAKAN PENGELOLAAN ENVIRONMENT & SECRETS
## SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
*Versi Dokumen: 1.0.0 | Klasifikasi: Internal Engineering | Tanggal: 21 Oktober 2026*

---

### 1. Prinsip Utama Pengelolaan Environment

Untuk melindungi data civitas akademika SMA Pemberdayaan Bangsa Ngrayun, seluruh lapisan sistem mengikuti prinsip keamanan:
1. **Zero Secret in Version Control**: Berkas `.env`, `.env.local`, dan berkas berisikan rahasia nyata **TIDAK BOLEH** di-commit ke Git.
2. **Strict Exclusion via `.gitignore`**: Pola `.env*` dikecualikan secara ketat pada root `.gitignore` dan `apps/api/.gitignore`.
3. **Template Berkas Bersih (`.env.example`)**: Hanya menyertakan nama variabel dan nilai placeholder deskriptif tanpa kredensial nyata.
4. **Isolasi Server vs Browser**: Variabel berawalan `NEXT_PUBLIC_` hanya digunakan untuk endpoint publik (misal URL backend). Variabel rahasia seperti `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, dan `DATABASE_URL` hanya berada di lingkungan server backend NestJS dan tidak pernah dikirim ke browser.

---

### 2. Standar Variabel Environment Sistem

#### A. Frontend Website (Next.js)
Lokasi: `.env.example`
| Variabel | Deskripsi | Batasan Akses |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL basis REST API backend SIAKAD | Publik (Browser & SSR) |

#### B. Backend REST API (NestJS)
Lokasi: `apps/api/.env.example`
| Variabel | Deskripsi | Standar Keamanan |
| :--- | :--- | :--- |
| `PORT` | Port socket server NestJS (default `4000`) | Internal Server |
| `NODE_ENV` | Mode lingkungan (`development`, `test`, `production`) | Internal Server |
| `APP_TIMEZONE` | Zona waktu operasional (`Asia/Jakarta`) | Internal Server |
| `DATABASE_URL` | String koneksi PostgreSQL 18 | Rahasia Tinggi (Kredensial DB) |
| `JWT_ACCESS_SECRET` | Kunci simetris penandatanganan access token 15 menit | Rahasia Sangat Tinggi (Minimal 32 karakter entropi tinggi) |
| `JWT_ACCESS_EXPIRES_IN`| Masa berlaku access token (default `15m`) | Standar Konfigurasi |
| `JWT_REFRESH_SECRET` | Kunci penandatanganan refresh token 7 hari | Rahasia Sangat Tinggi (Minimal 32 karakter entropi tinggi) |
| `JWT_REFRESH_EXPIRES_IN`| Masa berlaku refresh token (default `7d`) | Standar Konfigurasi |
| `CORS_ORIGINS` | Daftar domain tepercaya pemanggil API | Whitelist Ketat |
| `THROTTLE_TTL` | Jendela waktu rate limit milidetik (`60000`) | Pertahanan DoS |
| `THROTTLE_LIMIT` | Maksimum permintaan per IP (`100`) | Pertahanan DoS |

---

### 3. Prosedur Pembuatan Kunci Kriptografi Berkualitas Tinggi

Untuk menghasilkan kunci rahasia JWT yang aman di lingkungan staging/produksi, gunakan perintah bawaan OpenSSL atau modul kriptografi Node.js:

```bash
# Opsi 1: Menggunakan OpenSSL (Rekomendasi)
openssl rand -base64 48

# Opsi 2: Menggunakan Node.js Crypto CLI
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. Prosedur Rotasi Kredensial Rutin (Credential Rotation Runbook)

Rotasi berkala wajib dilakukan setiap **90 hari** atau saat terjadi pergantian personel administrator:

#### Langkah Rotasi JWT Secrets:
1. Generate dua kunci rahasia baru (untuk Access Token dan Refresh Token).
2. Perbarui nilai `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` pada berkas `.env` server backend.
3. Lakukan restart layanan NestJS:
   ```powershell
   # Pada lingkungan produksi
   pm2 restart siakad-api # atau restart systemd service
   ```
4. Seluruh sesi pengguna aktif akan kedaluwarsa secara aman dan pengguna diarahkan melakukan login ulang via form autentikasi institusi.

#### Langkah Rotasi Password Database PostgreSQL:
1. Masuk ke console psql sebagai superuser:
   ```sql
   ALTER USER siakad_user WITH PASSWORD 'PasswordBaruAcakEntropiTinggi2026!';
   ```
2. Perbarui variabel `DATABASE_URL` pada `apps/api/.env`.
3. Restart backend API dan periksa log kesehatan via `GET /api/v1/health`.

---

### 5. Prosedur Tanggap Darurat: Penanganan Rahasia yang Terekspos (Incident Response)

Jika kunci rahasia atau kredensial database terindikasi pernah terekspos (misal salah kirim atau ter-push ke repositori publik):

1. **JANGAN HANYA MENGHAPUS TEKS DARI FILE**: Rahasia yang pernah terekspos dianggap telah disusupi (*compromised*).
2. **SEGERA CABUT & GANTI KREDENSIAL (*REVOCATION*)**:
   - Ganti password pengguna PostgreSQL di database engine seketika.
   - Ganti `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` dengan string acak baru.
   - Hentikan seluruh koneksi database yang mencurigakan (`pg_terminate_backend`).
3. **BERSIHKAN RIWAYAT COMMIT JIKA PERLU**: Gunakan `git filter-repo` atau BFG Repo-Cleaner untuk menghapus jejak file sensitif dari riwayat Git sebelum sinkronisasi branch.
4. **CATAT SEBAGAI INSIDEN RESMI**: Catat waktu insiden, identitas kunci yang terdampak, langkah perbaikan, dan verifikasi bahwa tidak ada mutasi data ilegal pada tabel `audit_logs`.
