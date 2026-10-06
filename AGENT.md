# Dokumentasi Workflow Agentic AI
> **Project:** Geospatial Entity Management System  
> **Kandidat:** Fadillah Muamar (`fmuamar`)  
> **Evaluasi:** Take-Home Technical Test - Software Developer (PT Len Innovation Technology / PT PML)

---

## 1. Pendahuluan

Dokumen ini disusun untuk menjelaskan secara transparan sejauh apa dan bagaimana **Agentic AI** dimanfaatkan dalam proses perancangan, pengembangan, pengujian, hingga kontainerisasi sistem ini.

Alih-alih menggunakan AI hanya sebagai mesin penjawab pertanyaan atau *auto-complete snippet*, pendekatan yang diterapkan di sini adalah **Autonomous Pair-Programming Workflow**. Dalam paradigma ini, AI bertindak sebagai *agentic collaborator* yang beroperasi di bawah batasan arsitektur (*architectural guardrails*) dan instruksi eksplisit dari pengembang (*Human-in-the-Loop*).

---

## 2. Lingkungan & Tooling Agentic AI

### 2.1 Agent Environment & Model
* **IDE & Platform:** Google Antigravity Agentic IDE
* **Core Foundation Model:** Gemini 3.8 Flash (Thinking / Agentic Reasoning Mode)
* **Execution Capabilities:** Direct workspace tool execution (file read/write, terminal command execution, background task supervision, git operations, browser subagent testing).

### 2.2 Customizations, Rules & Skills Architecture
Untuk memastikan AI menghasilkan kode Go dan TypeScript yang idiomatik tanpa halusinasi pola usang, sistem dikonfigurasi dengan *rules* dan *skills* terspesialisasi:

1. **Workspace Rules (`.agent/rules/backend-go.md`):**
   * Menetapkan standar **Clean Architecture**: `Handler` → `Usecase` → `Repository` → `DB`.
   * Memastikan router menggunakan `Chi v5` (idiomatik standar `net/http`).
   * Melarang ORM berat dan mewajibkan `sqlx` dengan *parameterized queries* (`$1, $2`).
   * Menetapkan envelope respons JSON terstandar: `{"success": bool, "message": string, "data": ...}`.
   * Menetapkan batasan validasi geografis: Latitude `[-90.0, 90.0]` dan Longitude `[-180.0, 180.0]`.

2. **Specialized Skills Terpasang (`.agents/skills/`):**
   * `golang-database`: Panduan pola parameterized query, context propagation, pool tuning, dan scanning data.
   * `golang-pro`: Menjaga performa, penanganan error terstruktur, dan idiomatic Go.
   * `golang-structs-interfaces`: Pola abstraksi interface Go (*accept interfaces, return structs*).

3. **Model Context Protocol (MCP):**
   * Digunakan untuk inspeksi database langsung pada PostgreSQL lokal selama fase perancangan skema data.

---

## 3. Alur Workflow Pengerjaan (End-to-End Iteration)

Proses pengerjaan dibagi menjadi 6 fase terstruktur:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Architecture & Guardrails Setup                              │
│    - Aturan Clean Architecture Go, skema DTO, & aturan validasi │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ 2. Database Schema & Migration                                  │
│    - Tabel `entities`, indeks spasial coords, master table      │
│      `entity_types` dinamis dengan foreign-key RESTRICT         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ 3. Backend Implementation (Go Clean Architecture)               │
│    - Repository (sqlx) → Usecase → Handlers (Chi)               │
│    - Custom Coordinate Validator (pkg/validator)                │
│    - Unit tests untuk usecase & validator                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ 4. Frontend Implementation (React 19 + TypeScript + Leaflet)    │
│    - Leaflet Tactical Map, Custom SVG dynamic markers           │
│    - Click-to-pick coordinates pada peta                        │
│    - Form validation (Zod + React Hook Form)                    │
│    - Drawer Table, filter tipe/status/search, modal CRUD        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ 5. Full-Stack Containerization (Docker Compose & Nginx)         │
│    - Multi-stage build Go & Vite React                          │
│    - Nginx reverse-proxy rute `/api` (bebas CORS issue di prod) │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│ 6. Verification, Testing & Documentation                        │
│    - `go test ./...`, `npm run build`, cURL & Postman collection│
│    - Dokumentasi komprehensif (README.md & AGENT.md)            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Detail Tiap Fase

#### Fase 1: Perencanaan Arsitektur & Guardrails
* **Tindakan:** Mengidentifikasi seluruh kebutuhan teknis dari lembar tes (Go, React TS, Leaflet, validasi, map CRUD).
* **Kontribusi AI:** Merekomendasikan struktur monorepo (`backend/` dan `frontend/`) serta membuat file aturan `.agent/rules/backend-go.md` agar konsistensi kode Go terjaga dari awal.

#### Fase 2: Perancangan Skema Database
* **Tindakan:** Merancang tabel penyimpanan entitas spasial dan relasinya.
* **Kontribusi AI:** Mengusulkan pemisahan tabel master data `entity_types` (`000002_entity_types.sql`) daripada sekadar hardcoded enum. Tujuannya agar sistem bersifat dinamis: operator dapat menambah kategori objek baru (misal: UAV, Submarine, Satelit) langsung dari aplikasi tanpa redeploy backend.
* **Integritas Data:** Menambahkan indeks komposit pada `(latitude, longitude)` untuk query spasial yang cepat, serta `ON DELETE RESTRICT` pada Foreign Key.

#### Fase 3: Pengembangan Backend Go (Clean Architecture)
* **Tindakan:** Membangun RESTful API dengan pemisahan dependensi ketat:
  * `internal/entity`: Domain structs, enum status, DTO request/response, interface repository & usecase.
  * `internal/repository`: Implementasi database PostgreSQL menggunakan `sqlx` dengan parameterized raw SQL.
  * `internal/usecase`: Logika bisnis, generasi UUID v4, verifikasi tipe entitas terhadap master table, dan normalisasi metadata JSON.
  * `internal/handler`: HTTP controller, parsing payload, dan mapping ke *response envelope* standar.
  * `pkg/validator`: Engine validasi struct berbasis `go-playground/validator/v10` yang dilengkapi custom validator latitude `[-90, 90]` dan longitude `[-180, 180]`.
* **Testing:** Dibuatkan unit testing otomatis pada layer validator (`pkg/validator/validator_test.go`) dan usecase (`internal/usecase/entity_usecase_test.go`) dengan mock repository.

#### Fase 4: Pengembangan Frontend (React 19 + TypeScript + Leaflet)
* **Tindakan:** Membangun antarmuka taktis berbasis peta:
  * **Map Engine:** `react-leaflet` dengan 3 opsi layer (Carto Dark Matter, OSM Standard, Esri World Imagery).
  * **Tactical Markers:** Marker SVG kustom dengan warna dan ikon dinamis sesuai jenis entitas (mobil, sensor, tower, kapal, drone).
  * **Interactive Point Picker:** Pengguna dapat mengklik tombol "Pick on Map" pada form modal, lalu mengklik sembarang titik di peta untuk mengisi koordinat secara otomatis.
  * **Strict Form Validation:** Skema `Zod` yang disinkronkan dengan aturan backend untuk mencegah data tidak valid dikirim ke API.
  * **Server State & Caching:** Menggunakan `@tanstack/react-query` untuk caching data, auto-refetching saat mutasi berhasil, dan penanganan loading state yang mulus.
  * **Master Data Manager:** Menambahkan modal pengelolaan tipe entitas langsung dari UI.

#### Fase 5: Kontainerisasi Sistem (Docker Compose)
* **Tindakan:** Menyatukan seluruh ekosistem ke dalam satu konfigurasi `docker-compose.yml`:
  * Service `postgres:16-alpine` dengan auto-run SQL migrations via `/docker-entrypoint-initdb.d` dan health check.
  * Service `backend` menggunakan multi-stage build Go (builder `golang:1.26-alpine` → scratch/alpine runner) untuk menghasilkan image yang ramping dan aman.
  * Service `frontend` menggunakan multi-stage build Node + Nginx alpine. Nginx difungsikan sebagai reverse-proxy: menyajikan static assets React dan mem-proxy request `/api/` langsung ke backend service secara internal.

#### Fase 6: Verifikasi & Dokumentasi
* **Tindakan:** Menjalankan verifikasi sistem:
  * Menguji seluruh test suite: `go test -v ./...` (semua lulus).
  * Memvalidasi kompilasi bundle frontend: `npm run build` (lulus tanpa kesalahan tipe TypeScript).
  * Menguji live containers: `http://localhost:3000` dan `http://localhost:8080/health`.
  * Menghasilkan Postman collection lengkap dengan contoh request dan response.
  * Menyusun dokumentasi `README.md` dan `AGENT.md`.

---

## 4. Pembagian Peran: Human Developer vs Agentic AI

| Aspek Pekerjaan | Peran Pengembang (Human Developer) | Peran Agentic AI |
| :--- | :--- | :--- |
| **Requirements & Scope** | Mengarahkan cakupan teknis soal tes dan prioritas fitur | Menganalisis kebutuhan dan merancang checklist teknis |
| **Arsitektur & Desain** | Menentukan Clean Architecture, router Chi, sqlx, dan tema UI | Menghasilkan struktur boilerplate, type definitions, dan DTO |
| **Kualitas & Guardrails** | Menentukan aturan penamaan, batasan koordinat, dan pola error | Mematuhi aturan di `.agent/rules/` secara konsisten |
| **Implementasi Kode** | Melakukan review kode setiap iterasi dan meminta revisi | Menulis implementasi Go, TypeScript, CSS, dan SQL |
| **Pengujian & Validasi** | Menguji UX antarmuka peta, tombol picker, dan skenario edge cases | Mengotomatisasi penulisan unit test dan verifikasi terminal |
| **Docker & Ops** | Memastikan port tidak bentrok dan alur service compose benar | Menulis Dockerfile multi-stage dan konfigurasi Nginx |

---

## 5. Kesimpulan & Nilai Tambah

Penerapan **Agentic AI** pada pengujian teknis ini memberikan beberapa manfaat nyata:

1. **Efisiensi Pengembangan:** Pembangunan aplikasi *full-stack* yang lengkap (Go backend Clean Architecture + React 19 Leaflet GIS + Docker Compose) dapat diselesaikan secara sistematis dan rapi dalam waktu yang jauh lebih cepat.
2. **Kualitas & Ketelitian Kode:** Penggunaan aturan arsitektur yang ketat mencegah *spaghetti code*. Validasi ganda (*defense-in-depth*) diterapkan di tingkat Frontend (Zod), Backend (Go Validator), dan Database (SQL Constraints).
3. **Dokumentasi & Observabilitas:** Setiap perubahan kode tercatat dalam riwayat Git yang modular dengan pesan commit konvensional (*conventional commits*), dilengkapi unit test dan dokumentasi yang jelas.
