package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"geo-entities-backend/internal/entity"
)

// ErrEntityTypeNotFound is returned when an entity type cannot be found by code.
var ErrEntityTypeNotFound = errors.New("entity type not found")

// ErrEntityTypeInUse is returned when a Delete is blocked because entities
// still reference the type code (FK RESTRICT violation).
var ErrEntityTypeInUse = errors.New("entity type is still in use by one or more entities")

type postgresEntityTypeRepository struct {
	db *sqlx.DB
}

// NewPostgresEntityTypeRepository creates a new PostgreSQL-backed EntityTypeRepository.
func NewPostgresEntityTypeRepository(db *sqlx.DB) entity.EntityTypeRepository {
	return &postgresEntityTypeRepository{db: db}
}

// FindAll returns every entity type ordered by code.
func (r *postgresEntityTypeRepository) FindAll(ctx context.Context) ([]entity.EntityType, error) {
	const query = `SELECT code, name, icon, color, created_at, updated_at FROM entity_types ORDER BY code`

	var types []entity.EntityType
	if err := r.db.SelectContext(ctx, &types, query); err != nil {
		return nil, fmt.Errorf("entityTypeRepo.FindAll: %w", err)
	}

	if types == nil {
		types = []entity.EntityType{}
	}

	return types, nil
}

// FindByCode retrieves a single entity type by its primary key.
// Returns ErrEntityTypeNotFound when no row matches.
func (r *postgresEntityTypeRepository) FindByCode(ctx context.Context, code string) (*entity.EntityType, error) {
	const query = `SELECT code, name, icon, color, created_at, updated_at FROM entity_types WHERE code = $1`

	var et entity.EntityType
	if err := r.db.GetContext(ctx, &et, query, code); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEntityTypeNotFound
		}
		return nil, fmt.Errorf("entityTypeRepo.FindByCode: %w", err)
	}

	return &et, nil
}

// Create inserts a new entity type row. The caller must populate all fields
// (including timestamps) before calling this.
func (r *postgresEntityTypeRepository) Create(ctx context.Context, et *entity.EntityType) error {
	const query = `
		INSERT INTO entity_types (code, name, icon, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	if _, err := r.db.ExecContext(ctx, query,
		et.Code, et.Name, et.Icon, et.Color,
		et.CreatedAt, et.UpdatedAt,
	); err != nil {
		return fmt.Errorf("entityTypeRepo.Create: %w", err)
	}

	return nil
}

// Update modifies the mutable fields (name, icon, color) of an existing type.
func (r *postgresEntityTypeRepository) Update(ctx context.Context, et *entity.EntityType) error {
	const query = `
		UPDATE entity_types
		SET name = $1, icon = $2, color = $3, updated_at = $4
		WHERE code = $5
	`

	result, err := r.db.ExecContext(ctx, query,
		et.Name, et.Icon, et.Color, et.UpdatedAt, et.Code,
	)
	if err != nil {
		return fmt.Errorf("entityTypeRepo.Update: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("entityTypeRepo.Update rowsAffected: %w", err)
	}
	if rows == 0 {
		return ErrEntityTypeNotFound
	}

	return nil
}

// Delete removes an entity type by code. A FK RESTRICT violation (entities
// still referencing the type) is mapped to ErrEntityTypeInUse.
func (r *postgresEntityTypeRepository) Delete(ctx context.Context, code string) error {
	const query = `DELETE FROM entity_types WHERE code = $1`

	result, err := r.db.ExecContext(ctx, query, code)
	if err != nil {
		// pq error code 23503 = foreign_key_violation
		if isForeignKeyViolation(err) {
			return ErrEntityTypeInUse
		}
		return fmt.Errorf("entityTypeRepo.Delete: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("entityTypeRepo.Delete rowsAffected: %w", err)
	}
	if rows == 0 {
		return ErrEntityTypeNotFound
	}

	return nil
}

// isForeignKeyViolation checks whether err is a PostgreSQL 23503 FK violation
// by unwrapping to a *pq.Error and inspecting the SQLSTATE code field.
func isForeignKeyViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return pqErr.Code == "23503"
	}
	return false
}
