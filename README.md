# Geospatial Entity Management System
> **Technical Take-Home Test - Software Developer**  
> **PT Len Innovation Technology / PT PML**  
> **Kandidat:** Fadillah Muamar (`fmuamar`)  
> **Submission:** `muhammad.padmanaba@len-iot.io`

---

## 📌 Daftar Isi
1. [Ringkasan Proyek & Arsitektur](#-ringkasan-proyek--arsitektur)
2. [Pemenuhan Kebutuhan Fungsional](#-pemenuhan-kebutuhan-fungsional)
3. [Alasan Pemilihan Teknologi & Library](#-alasan-pemilihan-teknologi--library)
4. [Cara Menjalankan Program](#-cara-menjalankan-program)
   - [Opsi A: Menggunakan Docker Compose (Sangat Direkomendasikan)](#opsi-a-menggunakan-docker-compose-rekomendasi)
   - [Opsi B: Menjalankan Secara Manual (Development Mode)](#opsi-b-menjalankan-secara-manual-development-mode)
5. [Spesifikasi API & Dokumentasi Endpoint](#-spesifikasi-api--dokumentasi-endpoint)
6. [Validasi Data (Frontend & Backend)](#-validasi-data-frontend--backend)
7. [Postman Collection](#-postman-collection)
8. [Testing](#-testing)
9. [Status Penyelesaian Fitur](#-status-penyelesaian-fitur)
10. [Workflow Agentic AI](#-workflow-agentic-ai)

---

## 🏛 Ringkasan Proyek & Arsitektur

Aplikasi ini adalah sistem pemantauan dan pengelolaan entitas berbasis lokasi geografis (*Geospatial Entity Management System*) yang dirancang untuk skala operasional (misalnya unit patroli, perangkat IoT/sensor cerdas, radar fasilitas, UAV/drone, hingga kapal laut).

### Komponen Sistem:
* **Frontend:** React 19 + TypeScript + Vite, dikemas dengan tema *Industrial Tactical Defense Dashboard* (mendukung Dark & Light Mode).
* **Backend:** Go (1.26) dengan prinsip **Clean Architecture** (Handler → Usecase → Repository → Database).
* **Database:** PostgreSQL 16 dengan pengindeksan spasial & constraint koordinat geografis.
* **Reverse Proxy & Deployment:** Nginx reverse proxy + Docker Compose multi-stage build.

```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + TS)                 │
│  - React-Leaflet (OSM / Carto Dark / Esri Satellite)   │
│  - TanStack Query (State & Caching)                    │
│  - React Hook Form + Zod (Strict Validation)           │
│  - Tailwind CSS v4 (Industrial Tactical Theme)         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON REST API
┌───────────────────────────▼────────────────────────────┐
│                 Backend (Go 1.26 - Chi)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ HTTP Handlers (Standardized JSON Envelope)       │  │
│  └────────────────────────┬─────────────────────────┘  │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │ Usecases (Business Logic & Dynamic Type Rules)   │  │
│  └────────────────────────┬─────────────────────────┘  │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │ Repositories (sqlx parameterized queries)        │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ PostgreSQL Wire Protocol
┌───────────────────────────▼────────────────────────────┐
│              Database (PostgreSQL 16)                  │
│  - Tables: entities, entity_types                      │
│  - Spatial indexes: idx_entities_coords                │
│  - Foreign Keys & Coordinate Constraints               │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Pemenuhan Kebutuhan Fungsional

Semua kebutuhan fungsional dalam soal tes telah diimplementasikan **100% lengkap**:

| Kebutuhan Fungsional | Status | Implementasi Teknis |
| :--- | :---: | :--- |
| **Menampilkan entitas ke dalam map** | **LENGKAP** | Menggunakan `Leaflet` & `react-leaflet` dengan custom SVG marker taktis. Ikon dan warna marker dinamis sesuai tipe entitas (Kendaraan, IoT, Fasilitas, Drone, dll.). Mendukung 3 pilihan tile layer: *Carto Dark*, *OpenStreetMap*, dan *Esri Satellite*. |
| **Menambahkan entitas pada map** | **LENGKAP** | Modal form interaktif dilengkapi fitur **"Pick Location on Map"** (klik langsung di peta untuk mendapatkan koordinat presisi). Mendukung custom attributes JSON key-value. |
| **Mengubah (Update) entitas** | **LENGKAP** | Edit data atribut, status operasional (`ACTIVE`, `INACTIVE`, `MAINTENANCE`, `ALERT`), dan update koordinat langsung dari tabel maupun popup peta. |
| **Menghapus entitas pada map** | **LENGKAP** | Hapus entitas dengan konfirmasi modal pengaman agar tidak terhapus tidak sengaja. |
| **Melihat detail entitas pada map** | **LENGKAP** | Klik pada marker di peta membuka popup detail ringkas dan tombol fokus. Tersedia juga bottom/side drawer table dengan pencarian, filter status, filter tipe, dan pagination/sorting. |
| **Validasi input Frontend & Backend** | **LENGKAP** | **Frontend:** Zod schema + React Hook Form memvalidasi range latitude `[-90, 90]`, longitude `[-180, 180]`, nama, status, dan tipe.<br>**Backend:** `go-playground/validator/v10` dengan custom validation rule untuk latitude & longitude, pengecekan foreign key tipe entitas ke master table, dan DB check constraints. |
| **Fitur Tambahan (Master Data Entity Types)** | **BONUS** | Pengelolaan tipe entitas secara dinamis (Create, Read, Update, Delete) lengkap dengan pemilihan ikon Lucide dan warna kustom tanpa perlu hardcode di kode. |

---

## 💡 Alasan Pemilihan Teknologi & Library

### 1. Backend (Go)
* **Go Standard Library & `go-chi/chi/v5`:**
  * *Alasan:* Chi router sangat ringan, 100% kompatibel dengan idiom `net/http` bawaan Go, tidak memiliki overhead alokasi berlebih, serta mendukung sub-routing dan middleware komposisional (`Logger`, `Recoverer`, `RealIP`, `CORS`) yang bersih.
* **`jmoiron/sqlx` & `lib/pq`:**
  * *Alasan:* Menghindari kompleksitas dan *magic queries* dari ORM berat (seperti GORM). `sqlx` memberikan kendali penuh terhadap performa query SQL mentah menggunakan parameterized query (`$1, $2`), scanning otomatis ke struct Go, serta efisiensi connection pool.
* **`go-playground/validator/v10`:**
  * *Alasan:* Library validasi de-facto standar industri Go. Mendukung struct tags deklaratif dan pendaftaran validator custom (seperti batasan geografis `latitude` dan `longitude`).
* **Clean Architecture (Domain - Repository - Usecase - Handler):**
  * *Alasan:* Memisahkan domain logika bisnis dari layer transportasi (HTTP) dan database. Memudahkan unit testing, isolasi dependensi, dan kemudahan pemeliharaan jangka panjang.

### 2. Frontend (React + TypeScript)
* **React 19 + TypeScript + Vite:**
  * *Alasan:* Kombinasi standar modern dengan performa kompilasi ultra cepat (ESM-based HMR), static typing yang ketat untuk data geospatial DTO, dan arsitektur komponen yang modular.
* **`leaflet` & `react-leaflet`:**
  * *Alasan:* Library peta open-source paling stabil, ringan, dan tidak membutuhkan API Key berbayar pihak ketiga (seperti Mapbox/Google Maps). Mudah diintegrasikan dengan tile provider gratis berkualitas (CartoDB, OpenStreetMap) serta mendukung custom HTML/SVG divIcon.
* **`@tanstack/react-query` (v5):**
  * *Alasan:* Menangani server-state management, caching otomatis, invalidasi mutasi yang reaktif, deduplikasi request, serta indikator loading/error secara deklaratif tanpa boilerplate Redux yang berlebihan.
* **`react-hook-form` & `zod`:**
  * *Alasan:* `react-hook-form` memberikan form re-rendering minimal (performa tinggi). Digabungkan dengan `zod` melalui `@hookform/resolvers/zod` untuk validasi skema yang aman secara tipe data (*type-safe*).
* **Tailwind CSS v4:**
  * *Alasan:* Styling modern berbasis utility classes generasi terbaru tanpa file konfigurasi berat. Memungkinkan styling antarmuka taktis bertema industrial (*slate/zinc/cyan*) yang responsif.
* **`lucide-react`:**
  * *Alasan:* Koleksi ikon SVG yang konsisten, modern, dan ringan untuk merepresentasikan beragam simbol sensor, kendaraan, radar, dan status.

### 3. Database (PostgreSQL 16)
* *Alasan:* PostgreSQL memiliki keandalan ACID teruji, tipe data `JSONB` untuk atribut metadata entitas yang fleksibel, dan indeks B-Tree majemuk pada `(latitude, longitude)` untuk pencarian geografis yang cepat.

---

## 🚀 Cara Menjalankan Program

### Opsi A: Menggunakan Docker Compose (Rekomendasi)
Seluruh sistem (Database PostgreSQL, Backend API, dan Frontend Nginx Reverse Proxy) dapat dijalankan hanya dengan **1 perintah**:

#### Prasyarat:
* Pastikan **Docker** dan **Docker Compose** telah terpasang dan aktif di komputer Anda.

#### Langkah Menjalankan:
1. Clone repositori ini dan masuk ke direktori proyek:
   ```bash
   git clone <URL_REPOSITORY>
   cd ptpml-len-technical-test
   ```
2. Jalankan container:
   ```bash
   docker compose up --build -d
   ```
3. Tunggu hingga semua service sehat (*healthy*):
   * **Frontend Web Application:** Buka [http://localhost:3000](http://localhost:3000) pada browser.
   * **Backend API Base URL:** [http://localhost:8080](http://localhost:8080)
   * **Health Check API:** [http://localhost:8080/health](http://localhost:8080/health)
   * **PostgreSQL Database:** `localhost:5432` (`user: postgres`, `password: lentechtest`, `db: geo_entities`)
4. Untuk menghentikan container:
   ```bash
   docker compose down
   ```

---

### Opsi B: Menjalankan Secara Manual (Development Mode)

Jika Anda ingin menjalankan backend dan frontend secara terpisah di mesin lokal:

#### 1. Jalankan Database PostgreSQL
Gunakan Docker untuk menjalankan PostgreSQL saja:
```bash
docker compose up -d postgres
```
*(Skema dan data seeder otomatis diinisialisasi dari folder `backend/migrations/`)*.

#### 2. Jalankan Backend (Go)
1. Buka terminal baru dan masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Konfigurasi file environment (opsional jika menggunakan default):
   File `.env`:
   ```env
   PORT=8080
   DATABASE_URL=postgres://postgres:lentechtest@localhost:5432/geo_entities?sslmode=disable
   ```
3. Unduh dependensi dan jalankan server:
   ```bash
   go mod download
   go run cmd/api/main.go
   ```
   Server backend akan aktif di `http://localhost:8080`.

#### 3. Jalankan Frontend (React + Vite)
1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi Node:
   ```bash
   npm install
   ```
3. Pastikan konfigurasi `.env` mengarah ke backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```
4. Jalankan development server:
   ```bash
   npm run dev
   ```
5. Buka tautan yang muncul di terminal (biasanya `http://localhost:5173`).

---

## 📡 Spesifikasi API & Dokumentasi Endpoint

Semua response API dibungkus dalam format standar (*Standardized Envelope*):
```json
{
  "success": true,
  "message": "Deskripsi pesan status",
  "data": { ... }
}
```
Jika terjadi error:
```json
{
  "success": false,
  "message": "Deskripsi kesalahan",
  "error": "Detail error atau validasi"
}
```

### Daftar Endpoint:

| Method | Endpoint | Deskripsi | Query Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health check status server & koneksi database | - |
| `GET` | `/api/v1/entities` | Mengambil seluruh entitas geografis | `type`, `status`, `search` |
| `POST` | `/api/v1/entities` | Membuat entitas baru | - |
| `GET` | `/api/v1/entities/{id}` | Mengambil detail satu entitas | - |
| `PUT` | `/api/v1/entities/{id}` | Memperbarui seluruh data entitas | - |
| `DELETE` | `/api/v1/entities/{id}` | Menghapus entitas | - |
| `GET` | `/api/v1/entity-types` | Mengambil daftar master tipe entitas | - |
| `POST` | `/api/v1/entity-types` | Menambahkan tipe entitas baru | - |
| `GET` | `/api/v1/entity-types/{code}` | Mengambil detail tipe entitas | - |
| `PUT` | `/api/v1/entity-types/{code}` | Memperbarui tipe entitas | - |
| `DELETE` | `/api/v1/entity-types/{code}` | Menghapus tipe entitas (dilindungi FK) | - |

#### Contoh Payload Create Entity (`POST /api/v1/entities`):
```json
{
  "name": "Patrol Vessel KRI-01",
  "type": "VESSEL",
  "status": "ACTIVE",
  "latitude": -6.917464,
  "longitude": 107.619123,
  "metadata": {
    "speed_knots": 24,
    "crew": 15,
    "fuel_percent": 88
  }
}
```

---

## 🛡 Validasi Data (Frontend & Backend)

Validasi diterapkan secara ganda (*defense-in-depth*) pada kedua sisi:

### 1. Validasi Frontend (`Zod` + `React Hook Form`)
* `name`: Wajib diisi, minimal 1 karakter, maksimal 100 karakter.
* `type`: Wajib dipilih dari daftar master data `entity_types`.
* `status`: Wajib salah satu dari: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `ALERT`.
* `latitude`: Tipe angka valid, batasan ketat antara `-90.0` sampai `90.0`.
* `longitude`: Tipe angka valid, batasan ketat antara `-180.0` sampai `180.0`.
* Form menampilkan pesan kesalahan real-time di bawah masing-masing input field.

### 2. Validasi Backend (`go-playground/validator/v10` & Database)
* Struct validation DTO memeriksa aturan format, range, dan enum.
* Custom validator Go untuk koordinat bola bumi (`latitude` & `longitude`).
* **Validasi Integritas Relasi:** Kolom `type` dicek langsung ke tabel master `entity_types`. Jika tipe tidak terdaftar, request ditolak dengan pesan informatif (`400 Bad Request`).
* **Database Level:** Foreign Key `fk_entities_type` dengan proteksi `ON DELETE RESTRICT` sehingga tipe yang sedang digunakan oleh suatu entitas tidak dapat dihapus sembarangan.

---

## 📬 Postman Collection

File Postman Collection lengkap telah disertakan pada root repositori:
* File: `PT PML - PT Len Innovation Technology Technical Test - Fadillah Muamar.postman_collection.json`

### Cara Menggunakan:
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** lalu pilih file di atas.
3. Collection telah dikonfigurasi dengan variabel environment:
   * `host`: `http://localhost:8080`
4. Berisi pengujian lengkap untuk:
   * Health check
   * Create Entity (Valid & Invalid cases)
   * Get Entities (dengan filter & search)
   * Get Detail by ID
   * Update Entity
   * Delete Entity
   * Entity Types Master Data CRUD

---

## 🧪 Testing

Aplikasi backend dilengkapi dengan unit test:
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Jalankan test:
   ```bash
   go test -v ./...
   ```
Hasil pengujian:
```text
=== RUN   TestEntityUsecase_Create
--- PASS: TestEntityUsecase_Create (0.00s)
=== RUN   TestEntityUsecase_GetByID_NotFound
--- PASS: TestEntityUsecase_GetByID_NotFound (0.00s)
=== RUN   TestCoordinateValidation
--- PASS: TestCoordinateValidation (0.00s)
PASS
ok      geo-entities-backend/internal/usecase   0.585s
ok      geo-entities-backend/pkg/validator      0.589s
```

Frontend juga dapat diuji proses build dan kompilasi tipe datanya:
```bash
cd frontend
npm run build
```

---

## 📋 Status Penyelesaian Fitur

| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Tampilan Peta Interaktif | Selesai (100%) | Didukung Leaflet dengan custom tactical marker |
| Tambah Entitas (+ Point Picker) | Selesai (100%) | Form modal dengan klik peta untuk pilih koordinat |
| Ubah Entitas | Selesai (100%) | Edit koordinat, status, dan metadata JSON |
| Hapus Entitas | Selesai (100%) | Dilengkapi konfirmasi pengaman |
| Detail Entitas | Selesai (100%) | Popup peta + drawer table lengkap |
| Validasi Frontend & Backend | Selesai (100%) | Zod + go-playground/validator + DB constraints |
| Master Data Tipe Entitas | Selesai (100%) | Fitur bonus CRUD tipe entitas dinamis |
| Docker Compose Setup | Selesai (100%) | Siap dijalankan dengan satu perintah |
| Tidak Ada Fitur Tertunda | Selesai (100%) | Semua requirement selesai dan berfungsi optimal |

---

## 🤖 Workflow Agentic AI

Penjelasan mendalam mengenai pemanfaatan **Agentic AI** pada proyek ini dicatat secara lengkap pada berkas terpisah:
👉 **Silakan baca dokumen [`AGENT.md`](./AGENT.md)**
Dokumen tersebut menguraikan:
* Peran Agentic AI sebagai *autonomous pair-programmer*.
* Workflow iteratif (Spesifikasi arsitektur → Schema DB → Go Backend Clean Architecture → React Tactical GIS UI → Containerization & Verification).
* Tooling & MCP (Model Context Protocol) yang dimanfaatkan.
* Pembagian peran dan pengawasan kualitas oleh developer.
