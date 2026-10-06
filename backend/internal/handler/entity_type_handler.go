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

// EntityTypeHandler holds the Chi HTTP handlers for the entity-types resource.
type EntityTypeHandler struct {
	usecase  entity.EntityTypeUsecase
	validate *validator.Validate
}

// NewEntityTypeHandler creates an EntityTypeHandler wired to the given usecase and validator.
func NewEntityTypeHandler(uc entity.EntityTypeUsecase, v *validator.Validate) *EntityTypeHandler {
	return &EntityTypeHandler{usecase: uc, validate: v}
}

// --------------------------------------------------------------------------
// CRUD handlers for /api/v1/entity-types
// --------------------------------------------------------------------------

// GetAll handles GET /api/v1/entity-types — returns all master entity types.
// This endpoint is consumed by frontend dropdowns, map legends, and marker icons.
func (h *EntityTypeHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	types, err := h.usecase.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError,
			"Gagal mengambil daftar tipe entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Daftar tipe entitas berhasil diambil.", types)
}

// GetByCode handles GET /api/v1/entity-types/{code}.
func (h *EntityTypeHandler) GetByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	et, err := h.usecase.GetByCode(r.Context(), code)
	if err != nil {
		if errors.Is(err, repository.ErrEntityTypeNotFound) {
			respondError(w, http.StatusNotFound,
				"Tipe entitas tidak ditemukan.", "no entity type with code: "+code)
			return
		}
		respondError(w, http.StatusInternalServerError,
			"Gagal mengambil tipe entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Tipe entitas berhasil diambil.", et)
}

// Create handles POST /api/v1/entity-types.
func (h *EntityTypeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var dto entity.EntityTypePayloadDTO
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

	et, err := h.usecase.Create(r.Context(), dto)
	if err != nil {
		respondError(w, http.StatusInternalServerError,
			"Gagal membuat tipe entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusCreated, "Tipe entitas berhasil dibuat.", et)
}

// Update handles PUT /api/v1/entity-types/{code}.
func (h *EntityTypeHandler) Update(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var dto entity.EntityTypeUpdateDTO
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

	et, err := h.usecase.Update(r.Context(), code, dto)
	if err != nil {
		if errors.Is(err, repository.ErrEntityTypeNotFound) {
			respondError(w, http.StatusNotFound,
				"Tipe entitas tidak ditemukan.", "no entity type with code: "+code)
			return
		}
		respondError(w, http.StatusInternalServerError,
			"Gagal memperbarui tipe entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Tipe entitas berhasil diperbarui.", et)
}

// Delete handles DELETE /api/v1/entity-types/{code}.
// Returns 409 Conflict when entities still reference the type.
func (h *EntityTypeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	if err := h.usecase.Delete(r.Context(), code); err != nil {
		if errors.Is(err, repository.ErrEntityTypeNotFound) {
			respondError(w, http.StatusNotFound,
				"Tipe entitas tidak ditemukan.", "no entity type with code: "+code)
			return
		}
		if errors.Is(err, repository.ErrEntityTypeInUse) {
			respondError(w, http.StatusConflict,
				"Tipe entitas sedang digunakan dan tidak dapat dihapus.",
				"entity type '"+code+"' is still referenced by entities")
			return
		}
		respondError(w, http.StatusInternalServerError,
			"Gagal menghapus tipe entitas.", err.Error())
		return
	}

	respondSuccess(w, http.StatusOK, "Tipe entitas berhasil dihapus.", nil)
}
