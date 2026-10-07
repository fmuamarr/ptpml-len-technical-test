# Geospatial Entity Management System

Technical Take-Home Test - Software Developer  
PT Len Innovation Technology / PT PML  
Nama: Fadillah Muamar (`fmuamar`)  
Live Demo: http://187.52.122.182:3000/

---

## Ringkasan Proyek

Aplikasi web untuk menampilkan dan mengelola data entitas berbasis lokasi geografis (seperti kendaraan patroli, sensor IoT, fasilitas radar, drone, dll.) pada peta interaktif.

Stack utama yang digunakan:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet.
- **Backend:** Go 1.26, Chi router v5, sqlx, Clean Architecture (Handler -> Usecase -> Repository).
- **Database:** PostgreSQL 16 (dengan indexing koordinat dan kolom metadata JSONB).
- **Deployment:** Docker & Docker Compose (multi-stage build dengan Nginx reverse proxy).

---

## Daftar Isi

1. [Fitur & Pemenuhan Kebutuhan](#fitur--pemenuhan-kebutuhan)
2. [Alasan Pemilihan Library & Teknologi](#alasan-pemilihan-library--teknologi)
3. [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
   - [Opsi 1: Docker Compose (Direkomendasikan)](#opsi-1-docker-compose-direkomendasikan)
   - [Opsi 2: Manual (Local Development)](#opsi-2-manual-local-development)
4. [Endpoint API](#endpoint-api)
5. [Validasi Data](#validasi-data)
6. [Testing](#testing)
7. [Postman Collection](#postman-collection)
8. [Workflow AI (AGENT.md)](#workflow-ai-agentmd)

---

## Fitur & Pemenuhan Kebutuhan

Semua kebutuhan teknis pada soal tes sudah diimplementasikan:

| Kebutuhan Soal                           | Status  | Penjelasan Implementasi                                                                                                                                                            |
| :--------------------------------------- | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Menampilkan entitas pada peta**        | Selesai | Menggunakan Leaflet (`react-leaflet`). Marker tampil dengan warna dan ikon yang disesuaikan dengan tipe entitas. Mendukung layer Carto Dark, OpenStreetMap, dan Esri Satellite.    |
| **Tambah entitas**                       | Selesai | Form modal tambah data, dilengkapi tombol **Pick on Map** untuk mengambil titik latitude/longitude langsung dengan mengklik peta. Mendukung custom attribute (metadata key-value). |
| **Update entitas**                       | Selesai | Bisa mengedit data nama, tipe, status, koordinat, dan atribut tambahan melalui modal edit dari peta maupun tabel.                                                                  |
| **Hapus entitas**                        | Selesai | Dilengkapi modal konfirmasi untuk menghindari klik tidak sengaja.                                                                                                                  |
| **Detail entitas**                       | Selesai | Klik marker menampilkan popup ringkas dan tombol fokus. Tersedia juga panel drawer tabel data di bagian bawah/samping dengan fitur pencarian dan filter status/tipe.               |
| **Validasi Frontend & Backend**          | Selesai | Validasi koordinat (lat: -90 s/d 90, lon: -180 s/d 180), nama wajib diisi, dan tipe entitas diverifikasi terhadap database master data.                                            |
| **Kelola Tipe Entitas (Fitur Tambahan)** | Selesai | Modul CRUD master data tipe entitas langsung dari UI (pengguna bisa menambah tipe baru, memilih ikon, dan warna tanpa perlu ubah kode backend).                                    |

---

## Alasan Pemilihan Library & Teknologi

### Backend (Go)

- **Go Standard Library & `go-chi/chi/v5`:**  
  Chi kompatibel penuh dengan `net/http` bawaan Go, ringan, tidak boros alokasi memori, dan pembuatan middleware (CORS, Logger, Recoverer) sangat sederhana.
- **`jmoiron/sqlx` & `lib/pq`:**  
  Sengaja tidak memakai ORM seperti GORM agar query SQL tetap transparan, mudah dioptimasi, dan parameterized query (`$1, $2`) terhindar dari SQL injection. `sqlx` mempermudah mapping hasil query ke struct Go.
- **`go-playground/validator/v10`:**  
  Library validasi struct yang umum di Go. Memudahkan validasi field required, panjang karakter, dan pendaftaran custom validator untuk koordinat latitude/longitude.
- **Clean Architecture:**  
  Pemisahan kode menjadi handler, usecase, dan repository membuat logika bisnis terpisah dari transport layer (HTTP) dan database, sehingga kode lebih terstruktur dan mudah di-unit-test.

### Frontend (React + TypeScript)

- **React 19 + TypeScript + Vite:**  
  Kombinasi standar untuk aplikasi frontend modern. TypeScript mencegah bug runtime pada data spasial dan DTO, sementara Vite memberikan build time yang cepat.
- **`leaflet` & `react-leaflet`:**  
  Library peta open-source yang stabil dan ringan tanpa ketergantungan API key berbayar. Cukup fleksibel untuk membuat custom HTML/SVG marker.
- **`@tanstack/react-query`:**  
  Menangani fetching, caching, loading state, dan auto-refetch data secara otomatis setelah mutasi (create/update/delete) tanpa perlu banyak boilerplate state management global.
- **`react-hook-form` & `zod`:**  
  Validasi form di sisi browser jadi konsisten dan hemat re-render. Skema validasi Zod dibuat selaras dengan aturan backend.
- **Tailwind CSS v4:**  
  Utility-first CSS untuk mempercepat pembuatan tampilan UI tema industrial/defense yang responsif.
- **`lucide-react`:**  
  Set ikon SVG yang ringan untuk kebutuhan simbol marker (kendaraan, radar, sensor, kapal, drone).

### Database (PostgreSQL 16)

- Stabil dan mendukung tipe data `JSONB` untuk field metadata entitas yang fleksibel.
- Diberi composite index pada `(latitude, longitude)` untuk mempercepat filter dan pencarian berbasis koordinat.

---

## Cara Menjalankan Aplikasi

### Opsi 1: Docker Compose (Direkomendasikan)

Semua service (PostgreSQL, Go Backend, dan React Frontend + Nginx) sudah dikonfigurasi dalam `docker-compose.yml`.

1. Pastikan Docker dan Docker Compose sudah terpasang.
2. Jalankan perintah berikut di root folder proyek:
   ```bash
   docker compose up --build -d
   ```
3. Akses aplikasi:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8080](http://localhost:8080)
   - **Health Check:** [http://localhost:8080/health](http://localhost:8080/health)
4. Untuk mematikan container:
   ```bash
   docker compose down
   ```

---

### Opsi 2: Manual (Local Development)

Jika ingin menjalankan service secara terpisah tanpa Docker:

#### 1. Database PostgreSQL

Jalankan PostgreSQL lokal di port `5432` dengan database `geo_entities`. Anda juga bisa menyalakan database saja lewat Docker:

```bash
docker compose up -d postgres
```

_(File skema otomatis terbaca dari folder `backend/migrations/`)_.

#### 2. Backend (Go)

1. Buka terminal dan masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Pastikan file `.env` sudah sesuai:
   ```env
   PORT=8080
   DATABASE_URL=postgres://postgres:lentechtest@localhost:5432/geo_entities?sslmode=disable
   ```
3. Jalankan aplikasi:
   ```bash
   go run cmd/api/main.go
   ```
   Backend akan berjalan di port `8080`.

#### 3. Frontend (React + Vite)

1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Pastikan file `.env` mengarah ke backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka URL yang muncul di terminal (biasanya `http://localhost:5173`).

---

## Endpoint API

Format response API menggunakan struktur seragam:

```json
{
  "success": true,
  "message": "Pesan deskripsi",
  "data": { ... }
}
```

### Ringkasan Endpoint

| Method   | URL                           | Keterangan                                   | Query Params               |
| :------- | :---------------------------- | :------------------------------------------- | :------------------------- |
| `GET`    | `/health`                     | Cek status server dan koneksi database       | -                          |
| `GET`    | `/api/v1/entities`            | Mengambil semua entitas                      | `type`, `status`, `search` |
| `POST`   | `/api/v1/entities`            | Menambah entitas baru                        | -                          |
| `GET`    | `/api/v1/entities/{id}`       | Mengambil detail entitas berdasarkan ID      | -                          |
| `PUT`    | `/api/v1/entities/{id}`       | Update data entitas                          | -                          |
| `DELETE` | `/api/v1/entities/{id}`       | Hapus entitas                                | -                          |
| `GET`    | `/api/v1/entity-types`        | Mengambil master data tipe entitas           | -                          |
| `POST`   | `/api/v1/entity-types`        | Menambah tipe entitas baru                   | -                          |
| `GET`    | `/api/v1/entity-types/{code}` | Detail tipe entitas                          | -                          |
| `PUT`    | `/api/v1/entity-types/{code}` | Update tipe entitas                          | -                          |
| `DELETE` | `/api/v1/entity-types/{code}` | Hapus tipe entitas (terlindungi Foreign Key) | -                          |

#### Contoh Request Body Tambah Entitas (`POST /api/v1/entities`)

```json
{
  "name": "Patrol Vessel KRI-01",
  "type": "VESSEL",
  "status": "ACTIVE",
  "latitude": -6.917464,
  "longitude": 107.619123,
  "metadata": {
    "speed_knots": 24,
    "crew": 15
  }
}
```

---

## Validasi Data

Validasi diterapkan pada sisi Frontend dan Backend:

1. **Frontend (Zod + React Hook Form):**
   - Nama entitas wajib diisi (1 - 100 karakter).
   - Tipe entitas wajib dipilih.
   - Status harus salah satu dari: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `ALERT`.
   - Latitude wajib berupa angka antara `-90.0` sampai `90.0`.
   - Longitude wajib berupa angka antara `-180.0` sampai `180.0`.
   - Error langsung ditampilkan di bawah input yang bersangkutan.

2. **Backend (Validator v10 & Database):**
   - DTO divalidasi dengan tag struct bawaan dan custom validator untuk latitude/longitude.
   - Tipe entitas dicek langsung ke database master (`entity_types`). Jika tipe tidak valid, request ditolak dengan pesan error.
   - Tabel database menggunakan Foreign Key `ON DELETE RESTRICT` agar tipe yang masih dipakai oleh entitas tidak terhapus.

---

## Testing

Unit test pada backend mencakup pengujian validasi koordinat dan usecase logic:

```bash
cd backend
go test -v ./...
```

Hasil test:

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

Frontend type check & build test:

```bash
cd frontend
npm run build
```

---

## Postman Collection

File postman collection sudah disertakan di root repository:

- `PT PML - PT Len Innovation Technology Technical Test - Fadillah Muamar.postman_collection.json`

Silakan import file tersebut ke Postman. Variabel environment `{{host}}` sudah diset ke `http://localhost:8080`.

---

## Workflow AI (AGENT.md)

Penjelasan mengenai cara kerja dan batasan penggunaan Agentic AI selama pengerjaan tes ini dicatat pada file terpisah:  
👉 **[AGENT.md](./AGENT.md)**
