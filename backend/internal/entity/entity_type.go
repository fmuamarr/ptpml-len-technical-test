package entity

import (
	"context"
	"time"
)

// EntityType represents a master-data record for a geospatial entity type.
// Each type is keyed by a short code (e.g. "VEHICLE") and carries display
// metadata (name, Lucide icon identifier, badge colour) consumed by the
// frontend for map legends and marker rendering.
type EntityType struct {
	Code      string    `db:"code"       json:"code"`
	Name      string    `db:"name"       json:"name"`
	Icon      string    `db:"icon"       json:"icon"`
	Color     string    `db:"color"      json:"color"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// EntityTypePayloadDTO is the request body for create and update operations
// on the entity_types master table.
type EntityTypePayloadDTO struct {
	Code  string `json:"code"  validate:"required,min=1,max=50,uppercase"`
	Name  string `json:"name"  validate:"required,min=1,max=100"`
	Icon  string `json:"icon"  validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,min=1,max=20"`
}

// EntityTypeUpdateDTO is the request body for update operations — code is
// derived from the URL path parameter so it is not required in the body.
type EntityTypeUpdateDTO struct {
	Name  string `json:"name"  validate:"required,min=1,max=100"`
	Icon  string `json:"icon"  validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,min=1,max=20"`
}

// EntityTypeRepository defines the persistence contract for entity types.
type EntityTypeRepository interface {
	FindAll(ctx context.Context) ([]EntityType, error)
	FindByCode(ctx context.Context, code string) (*EntityType, error)
	Create(ctx context.Context, et *EntityType) error
	Update(ctx context.Context, et *EntityType) error
	Delete(ctx context.Context, code string) error
}

// EntityTypeUsecase defines the business-logic contract for entity types.
type EntityTypeUsecase interface {
	GetAll(ctx context.Context) ([]EntityType, error)
	GetByCode(ctx context.Context, code string) (*EntityType, error)
	Create(ctx context.Context, dto EntityTypePayloadDTO) (*EntityType, error)
	Update(ctx context.Context, code string, dto EntityTypeUpdateDTO) (*EntityType, error)
	Delete(ctx context.Context, code string) error
}
