package entity

import (
	"context"
	"encoding/json"
	"time"
)

// EntityStatus is an enumeration of allowed entity statuses.
type EntityStatus string

const (
	StatusActive      EntityStatus = "ACTIVE"
	StatusInactive    EntityStatus = "INACTIVE"
	StatusMaintenance EntityStatus = "MAINTENANCE"
	StatusAlert       EntityStatus = "ALERT"
)

// Entity is the core domain model mapped directly to the `entities` table.
// TypeDetail is populated by the usecase layer via a JOIN query and is NOT
// stored directly in the entities table.
type Entity struct {
	ID         string          `db:"id"         json:"id"`
	Name       string          `db:"name"       json:"name"`
	Type       string          `db:"type"       json:"type"`
	Status     string          `db:"status"     json:"status"`
	Latitude   float64         `db:"latitude"   json:"latitude"`
	Longitude  float64         `db:"longitude"  json:"longitude"`
	Metadata   json.RawMessage `db:"metadata"   json:"metadata"`
	CreatedAt  time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time       `db:"updated_at" json:"updated_at"`
	TypeDetail *EntityType     `db:"-"          json:"type_detail,omitempty"`
}

// EntityPayloadDTO is the request body for create and update operations.
// The `type` field is validated dynamically against entity_types(code) in the
// usecase layer rather than via a hardcoded oneof tag.
type EntityPayloadDTO struct {
	Name      string          `json:"name"      validate:"required,min=1,max=100"`
	Type      string          `json:"type"      validate:"required,min=1,max=50"`
	Status    string          `json:"status"    validate:"required,oneof=ACTIVE INACTIVE MAINTENANCE ALERT"`
	Latitude  float64         `json:"latitude"  validate:"required,latitude"`
	Longitude float64         `json:"longitude" validate:"required,longitude"`
	Metadata  json.RawMessage `json:"metadata"`
}

// FilterParams holds optional query-string filters for FindAll.
type FilterParams struct {
	Type   string
	Status string
	Search string
}

// Repository defines the persistence contract for entities.
type Repository interface {
	FindAll(ctx context.Context, filter FilterParams) ([]Entity, error)
	FindByID(ctx context.Context, id string) (*Entity, error)
	Create(ctx context.Context, e *Entity) error
	Update(ctx context.Context, e *Entity) error
	Delete(ctx context.Context, id string) error
}

// Usecase defines the business-logic contract for entities.
type Usecase interface {
	GetAll(ctx context.Context, filter FilterParams) ([]Entity, error)
	GetByID(ctx context.Context, id string) (*Entity, error)
	Create(ctx context.Context, dto EntityPayloadDTO) (*Entity, error)
	Update(ctx context.Context, id string, dto EntityPayloadDTO) (*Entity, error)
	Delete(ctx context.Context, id string) error
}
