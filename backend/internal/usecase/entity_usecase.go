package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"geo-entities-backend/internal/entity"
	"geo-entities-backend/internal/repository"
)

type entityUsecase struct {
	repo     entity.Repository
	typeRepo entity.EntityTypeRepository
}

// NewEntityUsecase creates a new EntityUsecase backed by the given repository.
// typeRepo is used for dynamic type validation against the entity_types master table.
func NewEntityUsecase(repo entity.Repository, typeRepo entity.EntityTypeRepository) entity.Usecase {
	return &entityUsecase{repo: repo, typeRepo: typeRepo}
}

// GetAll delegates to the repository after forwarding filter parameters.
func (u *entityUsecase) GetAll(ctx context.Context, filter entity.FilterParams) ([]entity.Entity, error) {
	entities, err := u.repo.FindAll(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("usecase.GetAll: %w", err)
	}
	return entities, nil
}

// GetByID retrieves a single entity by ID, propagating not-found errors unchanged
// so the handler layer can make correct HTTP-status decisions.
func (u *entityUsecase) GetByID(ctx context.Context, id string) (*entity.Entity, error) {
	e, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err // repository already wraps or uses sentinel
	}
	return e, nil
}

// Create generates a v4 UUID, validates type against master data, serializes
// metadata, stamps UTC timestamps, and persists the new entity.
func (u *entityUsecase) Create(ctx context.Context, dto entity.EntityPayloadDTO) (*entity.Entity, error) {
	if err := u.validateType(ctx, dto.Type); err != nil {
		return nil, err
	}

	metadata, err := normalizeMetadata(dto.Metadata)
	if err != nil {
		return nil, fmt.Errorf("usecase.Create metadata: %w", err)
	}

	now := time.Now().UTC()
	e := &entity.Entity{
		ID:        uuid.New().String(),
		Name:      dto.Name,
		Type:      dto.Type,
		Status:    dto.Status,
		Latitude:  dto.Latitude,
		Longitude: dto.Longitude,
		Metadata:  metadata,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := u.repo.Create(ctx, e); err != nil {
		return nil, fmt.Errorf("usecase.Create: %w", err)
	}

	return e, nil
}

// Update applies the DTO fields to an existing entity and persists the changes.
func (u *entityUsecase) Update(ctx context.Context, id string, dto entity.EntityPayloadDTO) (*entity.Entity, error) {
	if err := u.validateType(ctx, dto.Type); err != nil {
		return nil, err
	}

	existing, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	metadata, err := normalizeMetadata(dto.Metadata)
	if err != nil {
		return nil, fmt.Errorf("usecase.Update metadata: %w", err)
	}

	existing.Name = dto.Name
	existing.Type = dto.Type
	existing.Status = dto.Status
	existing.Latitude = dto.Latitude
	existing.Longitude = dto.Longitude
	existing.Metadata = metadata
	existing.UpdatedAt = time.Now().UTC()

	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}

// validateType checks that the given type code exists in the entity_types
// master table. Returns a descriptive error suitable for the handler layer.
func (u *entityUsecase) validateType(ctx context.Context, typeCode string) error {
	_, err := u.typeRepo.FindByCode(ctx, typeCode)
	if err != nil {
		if errors.Is(err, repository.ErrEntityTypeNotFound) {
			return fmt.Errorf("tipe entitas '%s' tidak ditemukan dalam master data", typeCode)
		}
		return fmt.Errorf("usecase.validateType: %w", err)
	}
	return nil
}

// Delete removes an entity by ID, propagating not-found errors unchanged.
func (u *entityUsecase) Delete(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

// normalizeMetadata ensures metadata is always a valid JSON object.
// A nil or empty payload becomes `{}`.
func normalizeMetadata(raw json.RawMessage) (json.RawMessage, error) {
	if len(raw) == 0 {
		return json.RawMessage(`{}`), nil
	}

	// Validate it is parseable JSON before persisting
	var check interface{}
	if err := json.Unmarshal(raw, &check); err != nil {
		return nil, fmt.Errorf("invalid JSON metadata: %w", err)
	}

	return raw, nil
}
