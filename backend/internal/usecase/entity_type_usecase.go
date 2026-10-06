package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"geo-entities-backend/internal/entity"
	"geo-entities-backend/internal/repository"
)

type entityTypeUsecase struct {
	repo entity.EntityTypeRepository
}

// NewEntityTypeUsecase creates a new EntityTypeUsecase backed by the given repository.
func NewEntityTypeUsecase(repo entity.EntityTypeRepository) entity.EntityTypeUsecase {
	return &entityTypeUsecase{repo: repo}
}

// GetAll returns all entity types.
func (u *entityTypeUsecase) GetAll(ctx context.Context) ([]entity.EntityType, error) {
	types, err := u.repo.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("entityTypeUsecase.GetAll: %w", err)
	}
	return types, nil
}

// GetByCode retrieves a single entity type by code, propagating not-found
// errors so the handler can make the correct HTTP-status decision.
func (u *entityTypeUsecase) GetByCode(ctx context.Context, code string) (*entity.EntityType, error) {
	et, err := u.repo.FindByCode(ctx, strings.ToUpper(code))
	if err != nil {
		return nil, err
	}
	return et, nil
}

// Create normalises the code to uppercase, stamps timestamps, and persists a
// new entity type record.
func (u *entityTypeUsecase) Create(ctx context.Context, dto entity.EntityTypePayloadDTO) (*entity.EntityType, error) {
	now := time.Now().UTC()
	et := &entity.EntityType{
		Code:      strings.ToUpper(strings.TrimSpace(dto.Code)),
		Name:      strings.TrimSpace(dto.Name),
		Icon:      strings.TrimSpace(dto.Icon),
		Color:     strings.TrimSpace(dto.Color),
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := u.repo.Create(ctx, et); err != nil {
		return nil, fmt.Errorf("entityTypeUsecase.Create: %w", err)
	}

	return et, nil
}

// Update applies DTO fields to an existing entity type and persists the changes.
func (u *entityTypeUsecase) Update(ctx context.Context, code string, dto entity.EntityTypeUpdateDTO) (*entity.EntityType, error) {
	existing, err := u.repo.FindByCode(ctx, strings.ToUpper(code))
	if err != nil {
		return nil, err // propagate ErrEntityTypeNotFound unchanged
	}

	existing.Name = strings.TrimSpace(dto.Name)
	existing.Icon = strings.TrimSpace(dto.Icon)
	existing.Color = strings.TrimSpace(dto.Color)
	existing.UpdatedAt = time.Now().UTC()

	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("entityTypeUsecase.Update: %w", err)
	}

	return existing, nil
}

// Delete removes an entity type by code, propagating both not-found and
// in-use errors so the handler can return the correct status code.
func (u *entityTypeUsecase) Delete(ctx context.Context, code string) error {
	err := u.repo.Delete(ctx, strings.ToUpper(code))
	if err != nil {
		if err == repository.ErrEntityTypeInUse {
			return err
		}
		return fmt.Errorf("entityTypeUsecase.Delete: %w", err)
	}
	return nil
}
