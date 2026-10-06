package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"geo-entities-backend/internal/entity"
)

// ErrEntityNotFound is returned when an entity cannot be found by ID.
var ErrEntityNotFound = errors.New("entity not found")

type postgresEntityRepository struct {
	db *sqlx.DB
}

// NewPostgresEntityRepository creates a new PostgreSQL-backed EntityRepository.
func NewPostgresEntityRepository(db *sqlx.DB) entity.Repository {
	return &postgresEntityRepository{db: db}
}

// entityRow is a flat scan target that merges entities columns with the
// joined entity_types columns. After scanning we reshape it into entity.Entity.
type entityRow struct {
	ID        string          `db:"id"`
	Name      string          `db:"name"`
	Type      string          `db:"type"`
	Status    string          `db:"status"`
	Latitude  float64         `db:"latitude"`
	Longitude float64         `db:"longitude"`
	Metadata  []byte          `db:"metadata"`
	CreatedAt sql.NullTime    `db:"created_at"`
	UpdatedAt sql.NullTime    `db:"updated_at"`
	// entity_types columns (may be NULL when no JOIN match — guard with LEFT JOIN)
	ETCode      sql.NullString `db:"et_code"`
	ETName      sql.NullString `db:"et_name"`
	ETIcon      sql.NullString `db:"et_icon"`
	ETColor     sql.NullString `db:"et_color"`
	ETCreatedAt sql.NullTime   `db:"et_created_at"`
	ETUpdatedAt sql.NullTime   `db:"et_updated_at"`
}

func (row entityRow) toEntity() entity.Entity {
	e := entity.Entity{
		ID:        row.ID,
		Name:      row.Name,
		Type:      row.Type,
		Status:    row.Status,
		Latitude:  row.Latitude,
		Longitude: row.Longitude,
		Metadata:  row.Metadata,
	}
	if row.CreatedAt.Valid {
		e.CreatedAt = row.CreatedAt.Time
	}
	if row.UpdatedAt.Valid {
		e.UpdatedAt = row.UpdatedAt.Time
	}
	if row.ETCode.Valid {
		et := &entity.EntityType{
			Code:  row.ETCode.String,
			Name:  row.ETName.String,
			Icon:  row.ETIcon.String,
			Color: row.ETColor.String,
		}
		if row.ETCreatedAt.Valid {
			et.CreatedAt = row.ETCreatedAt.Time
		}
		if row.ETUpdatedAt.Valid {
			et.UpdatedAt = row.ETUpdatedAt.Time
		}
		e.TypeDetail = et
	}
	return e
}

// joinSelect is the reusable SELECT + LEFT JOIN fragment used by FindAll and FindByID.
const joinSelect = `
	SELECT
		e.id, e.name, e.type, e.status, e.latitude, e.longitude,
		e.metadata, e.created_at, e.updated_at,
		et.code       AS et_code,
		et.name       AS et_name,
		et.icon       AS et_icon,
		et.color      AS et_color,
		et.created_at AS et_created_at,
		et.updated_at AS et_updated_at
	FROM entities e
	LEFT JOIN entity_types et ON et.code = e.type
`

// FindAll returns all entities, optionally filtered by type, status, and a
// case-insensitive name search. Results include enriched type_detail metadata.
func (r *postgresEntityRepository) FindAll(ctx context.Context, filter entity.FilterParams) ([]entity.Entity, error) {
	query := joinSelect + ` WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if filter.Type != "" {
		query += fmt.Sprintf(" AND e.type = $%d", argIdx)
		args = append(args, filter.Type)
		argIdx++
	}

	if filter.Status != "" {
		query += fmt.Sprintf(" AND e.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}

	if filter.Search != "" {
		query += fmt.Sprintf(" AND e.name ILIKE $%d", argIdx)
		args = append(args, "%"+strings.TrimSpace(filter.Search)+"%")
		argIdx++
	}

	query += " ORDER BY e.created_at DESC"

	_ = argIdx // suppress "declared and not used" when no filters applied

	rows, err := r.db.QueryxContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("repository.FindAll: %w", err)
	}
	defer rows.Close()

	var entities []entity.Entity
	for rows.Next() {
		var row entityRow
		if err := rows.StructScan(&row); err != nil {
			return nil, fmt.Errorf("repository.FindAll scan: %w", err)
		}
		entities = append(entities, row.toEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("repository.FindAll rows: %w", err)
	}

	if entities == nil {
		entities = []entity.Entity{}
	}

	return entities, nil
}

// FindByID retrieves a single entity by its primary key with type_detail enrichment.
// Returns ErrEntityNotFound when no row matches.
func (r *postgresEntityRepository) FindByID(ctx context.Context, id string) (*entity.Entity, error) {
	query := joinSelect + ` WHERE e.id = $1`

	rows, err := r.db.QueryxContext(ctx, query, id)
	if err != nil {
		return nil, fmt.Errorf("repository.FindByID: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, fmt.Errorf("repository.FindByID rows: %w", err)
		}
		return nil, ErrEntityNotFound
	}

	var row entityRow
	if err := rows.StructScan(&row); err != nil {
		return nil, fmt.Errorf("repository.FindByID scan: %w", err)
	}

	e := row.toEntity()
	return &e, nil
}

// Create inserts a new entity row. The caller must populate all fields including ID
// and timestamps before calling this.
func (r *postgresEntityRepository) Create(ctx context.Context, e *entity.Entity) error {
	const query = `
		INSERT INTO entities (id, name, type, status, latitude, longitude, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	if _, err := r.db.ExecContext(ctx, query,
		e.ID, e.Name, e.Type, e.Status,
		e.Latitude, e.Longitude, e.Metadata,
		e.CreatedAt, e.UpdatedAt,
	); err != nil {
		return fmt.Errorf("repository.Create: %w", err)
	}

	return nil
}

// Update modifies all mutable fields of an existing entity row.
func (r *postgresEntityRepository) Update(ctx context.Context, e *entity.Entity) error {
	const query = `
		UPDATE entities
		SET name = $1, type = $2, status = $3, latitude = $4, longitude = $5, metadata = $6, updated_at = $7
		WHERE id = $8
	`

	result, err := r.db.ExecContext(ctx, query,
		e.Name, e.Type, e.Status,
		e.Latitude, e.Longitude, e.Metadata,
		e.UpdatedAt, e.ID,
	)
	if err != nil {
		return fmt.Errorf("repository.Update: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("repository.Update rows affected: %w", err)
	}
	if rows == 0 {
		return ErrEntityNotFound
	}

	return nil
}

// Delete removes an entity by ID.
func (r *postgresEntityRepository) Delete(ctx context.Context, id string) error {
	const query = `DELETE FROM entities WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("repository.Delete: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("repository.Delete rows affected: %w", err)
	}
	if rows == 0 {
		return ErrEntityNotFound
	}

	return nil
}
