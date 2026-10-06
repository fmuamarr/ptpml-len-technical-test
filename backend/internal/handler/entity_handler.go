package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"

	"geo-entities-backend/internal/entity"
	"geo-entities-backend/internal/repository"
)

// EntityHandler holds the Chi HTTP handlers for the entity resource.
type EntityHandler struct {
	usecase  entity.Usecase
	validate *validator.Validate
	pingFn   func() error
}

// NewEntityHandler creates an EntityHandler wired to the given usecase and validator.
// pingFn is called by the health endpoint; pass `func() error { return db.PingContext(ctx) }`.
func NewEntityHandler(uc entity.Usecase, v *validator.Validate, pingFn func() error) *EntityHandler {
	return &EntityHandler{
		usecase:  uc,
		validate: v,
		pingFn:   pingFn,
	}
}

// --------------------------------------------------------------------------
// Health
// --------------------------------------------------------------------------

// Health handles GET /health — pings the database and returns liveness status.
func (h *EntityHandler) Health(w http.ResponseWriter, r *http.Request) {
	if err := h.pingFn(); err != nil {
		respondError(w, http.StatusServiceUnavailable,
			"Layanan tidak tersedia.", "database unreachable: "+err.Error())
		return
	}
	respondSuccess(w, http.StatusOK, "Layanan berjalan normal.", map[string]string{"status": "ok"})
}

// --------------------------------------------------------------------------
// CRUD handlers
// --------------------------------------------------------------------------

// GetAll handles GET /api/v1/entities — supports ?type= &status= &search= query params.
func (h *EntityHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	filter := entity.FilterParams{
		Type:   r.URL.Query().Get("type"),
		Status: r.URL.Query().Get("status"),
		Search: r.URL.Query().Get("search"),
	}

	entities, err := h.usecase.GetAll(r.Context(), filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError,
			"Gagal mengambil daftar entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Daftar entitas berhasil diambil.", entities)
}

// GetByID handles GET /api/v1/entities/{id}.
func (h *EntityHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	e, err := h.usecase.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrEntityNotFound) {
			respondError(w, http.StatusNotFound,
				"Entitas tidak ditemukan.", "no entity with id: "+id)
			return
		}
		respondError(w, http.StatusInternalServerError,
			"Gagal mengambil entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Entitas berhasil diambil.", e)
}

// Create handles POST /api/v1/entities.
func (h *EntityHandler) Create(w http.ResponseWriter, r *http.Request) {
	var dto entity.EntityPayloadDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		respondError(w, http.StatusBadRequest,
			"Format JSON tidak valid.", err.Error())
		return
	}

	if err := h.validate.StructCtx(r.Context(), dto); err != nil {
		respondError(w, http.StatusUnprocessableEntity,
			"Validasi gagal.", formatValidationErrors(err))
		return
	}

	e, err := h.usecase.Create(r.Context(), dto)
	if err != nil {
		// Dynamic type validation error from usecase
		respondError(w, http.StatusUnprocessableEntity,
			"Gagal membuat entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusCreated, "Entitas berhasil dibuat.", e)
}

// Update handles PUT /api/v1/entities/{id}.
func (h *EntityHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var dto entity.EntityPayloadDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		respondError(w, http.StatusBadRequest,
			"Format JSON tidak valid.", err.Error())
		return
	}

	if err := h.validate.StructCtx(r.Context(), dto); err != nil {
		respondError(w, http.StatusUnprocessableEntity,
			"Validasi gagal.", formatValidationErrors(err))
		return
	}

	e, err := h.usecase.Update(r.Context(), id, dto)
	if err != nil {
		if errors.Is(err, repository.ErrEntityNotFound) {
			respondError(w, http.StatusNotFound,
				"Entitas tidak ditemukan.", "no entity with id: "+id)
			return
		}
		respondError(w, http.StatusUnprocessableEntity,
			"Gagal memperbarui entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Entitas berhasil diperbarui.", e)
}

// Delete handles DELETE /api/v1/entities/{id}.
func (h *EntityHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.usecase.Delete(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrEntityNotFound) {
			respondError(w, http.StatusNotFound,
				"Entitas tidak ditemukan.", "no entity with id: "+id)
			return
		}
		respondError(w, http.StatusInternalServerError,
			"Gagal menghapus entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Entitas berhasil dihapus.", nil)
}

// --------------------------------------------------------------------------
// Validation formatting helpers
// --------------------------------------------------------------------------

func formatValidationErrors(err error) string {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		msgs := make([]string, 0, len(ve))
		for _, fe := range ve {
			msgs = append(msgs, fe.Field()+": "+validationMessage(fe))
		}
		return joinStrings(msgs, "; ")
	}
	return err.Error()
}

func validationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "wajib diisi"
	case "min":
		return "minimal " + fe.Param() + " karakter"
	case "max":
		return "maksimal " + fe.Param() + " karakter"
	case "oneof":
		return "harus salah satu dari: " + fe.Param()
	case "latitude":
		return "harus antara -90 dan 90"
	case "longitude":
		return "harus antara -180 dan 180"
	case "uppercase":
		return "harus huruf kapital semua"
	default:
		return "gagal validasi: " + fe.Tag()
	}
}

func joinStrings(s []string, sep string) string {
	result := ""
	for i, v := range s {
		if i > 0 {
			result += sep
		}
		result += v
	}
	return result
}
