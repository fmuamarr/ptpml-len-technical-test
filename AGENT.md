# Dokumentasi Penggunaan Agentic AI

> **Proyek:** Geospatial Entity Management System  
> **Kandidat:** Fadillah Muamar (`fmuamar`)  
> **Kebutuhan Tes:** Menjelaskan workflow penggunaan Agentic AI pada pengerjaan technical test.

---

## 1. Pendekatan & Alat yang Digunakan

Pada pengerjaan take-home test ini, saya menggunakan **Google Antigravity Agentic IDE** dengan model **Gemini 3.8 Flash** untuk frontend dan **Claude Sonnet** untuk backend sebagai asisten coding (_pair-programming_).

Pendekatan yang saya terapkan bukan meminta AI membuat aplikasi secara sekaligus (_one-shot prompt_), melainkan memecah pengerjaan ke dalam tahapan-tahapan kecil dengan batasan teknis (_rules_) yang sudah saya tentukan sejak awal.

---

## 2. Aturan & Batasan yang Ditetapkan (Guardrails)

Sebelum penulisan kode dimulai, saya membuat file aturan di `.agent/rules/backend-go.md` untuk membatasi ruang gerak AI agar menghasilkan kode yang konsisten:

- **Arsitektur Go:** Wajib menerapkan _Clean Architecture_ dengan pemisahan layer yang jelas: `Handler` -> `Usecase` -> `Repository` -> `DB`.
- **Router:** Wajib menggunakan `go-chi/chi/v5` (idiom `net/http` standar Go).
- **Database Access:** Menghindari ORM berat (seperti GORM). Wajib menggunakan `sqlx` dengan parameterized raw SQL (`$1, $2`) agar query transparan dan aman dari SQL injection.
- **Standar Response:** Format JSON seragam: `{"success": bool, "message": string, "data": ...}`.
- **Validasi Koordinat:** Latitude dibatasi `[-90.0, 90.0]` dan Longitude `[-180.0, 180.0]`.

---

## 3. Alur Kerja Pengerjaan (Step-by-Step)

### Tahap 1: Desain Skema Database & Migrasi

- Menentukan skema database PostgreSQL untuk menyimpan entitas dengan kolom koordinat (`latitude`, `longitude`) dan atribut dinamis (`metadata JSONB`).
- Menambahkan tabel master `entity_types` agar kategori entitas tidak di-hardcode sebagai enum kaku, melainkan dinamis dan memiliki relasi Foreign Key dengan aturan `ON DELETE RESTRICT`.
- Menambahkan indeks komposit pada `(latitude, longitude)` untuk optimasi query lokasi.

### Tahap 2: Backend API (Go)

- Menyiapkan repository layer dengan `sqlx` untuk operasi CRUD entitas dan tipe entitas.
- Menyiapkan usecase layer untuk validasi bisnis (cek tipe ke database master, normalisasi JSON metadata, UUID generator).
- Membuat custom validator untuk koordinat geografis di package `pkg/validator` menggunakan `go-playground/validator/v10`.
- Menyusun handler HTTP dengan Chi router, middleware CORS, logger, dan recoverer.
- Menulis unit test untuk validator koordinat dan usecase logic (`go test -v ./...`).

### Tahap 3: Frontend (React + TypeScript)

- Setup project React 19 + TypeScript menggunakan Vite dan Tailwind CSS v4.
- Integrasi peta menggunakan `react-leaflet` dengan 3 tile provider (Carto Dark, OpenStreetMap, Esri Satellite).
- Membuat custom tactical marker yang menampilkan ikon dan warna sesuai data tipe entitas.
- Mengembangkan fitur **Pick Location on Map**: pengguna bisa mengklik titik di peta saat modal form terbuka untuk otomatis mengisi input latitude dan longitude.
- Integrasi `@tanstack/react-query` untuk handling server state, caching, dan invalidasi data setelah operasi create/update/delete.
- Validasi form di client-side menggunakan `react-hook-form` dan skema `zod`.
- Menambahkan drawer table untuk pencarian teks, filter tipe, filter status, dan sorting.

### Tahap 4: Docker & Reverse Proxy

- Menulis `Dockerfile` multi-stage untuk backend Go (menggunakan image alpine agar ukuran image kecil).
- Menulis `Dockerfile` multi-stage untuk frontend React dengan Nginx alpine.
- Mengatur konfigurasi Nginx sebagai reverse proxy untuk merutekan request `/api/` langsung ke backend di dalam network Docker.
- Menyusun `docker-compose.yml` agar seluruh stack (PostgreSQL + migration, backend, frontend) dapat dijalankan hanya dengan 1 perintah `docker compose up --build`.

### Tahap 5: Verifikasi & Testing

- Menguji seluruh endpoint backend menggunakan Postman dan menyimpan request/response ke dalam file collection.
- Menjalankan `go test ./...` dan build frontend `npm run build` untuk memastikan tidak ada error kompilasi TypeScript.

---

## 4. Pembagian Peran: Developer vs AI

| Bagian                  | Peran Saya (Developer)                                                                                           | Bantuan AI                                                                                |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Arsitektur & Konsep** | Menentukan Clean Architecture, memilih stack (Chi, sqlx, Leaflet, React Query), dan menentukan batasan validasi. | Memberikan saran struktur folder awal dan file scaffolding.                               |
| **Database**            | Menentukan relasi tabel, indexing koordinat, dan foreign key constraints.                                        | Menulis script SQL migration dan seeder awal.                                             |
| **Backend Go**          | Mereview alur usecase, memastikan error handling tidak bocor, dan menetapkan standar response envelope.          | Menulis boilerplate struct DTO, query sqlx, custom validator, dan unit test table-driven. |
| **Frontend React**      | Menentukan interaksi UI (drawer table, modal pick coordinate, tema dark/light).                                  | Menulis komponen React, styling Tailwind, dan skema Zod.                                  |
| **DevOps / Docker**     | Menentukan konfigurasi port, network, dan flow reverse proxy Nginx.                                              | Menulis Dockerfile multi-stage dan konfigurasi Nginx proxy.                               |
| **Quality Control**     | Menjalankan test manual, mengecek edge cases koordinat di peta, dan verifikasi Postman.                          | Membantu otomatisasi eksekusi command testing dan formatting code.                        |

---

## 5. Ringkasan

Penggunaan Agentic AI pada pengerjaan tes ini sangat membantu dalam mempercepat penulisan kode berulang (_boilerplate_), penyusunan DTO. Namun demikian, penentuan arsitektur sistem, aturan validasi, pemilihan library, dan kendali kualitas kode tetap diarahkan dan direview secara aktif oleh saya sebagai pengembang.
