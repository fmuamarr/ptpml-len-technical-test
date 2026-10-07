package usecase_test

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"geo-entities-backend/internal/entity"
	"geo-entities-backend/internal/repository"
	"geo-entities-backend/internal/usecase"
)

type mockEntityRepo struct {
	entities []entity.Entity
	created  *entity.Entity
}

func (m *mockEntityRepo) FindAll(ctx context.Context, filter entity.FilterParams) ([]entity.Entity, error) {
	return m.entities, nil
}

func (m *mockEntityRepo) FindByID(ctx context.Context, id string) (*entity.Entity, error) {
	for _, e := range m.entities {
		if e.ID == id {
			return &e, nil
		}
	}
	return nil, repository.ErrEntityNotFound
}

func (m *mockEntityRepo) Create(ctx context.Context, e *entity.Entity) error {
	m.created = e
	m.entities = append(m.entities, *e)
	return nil
}

func (m *mockEntityRepo) Update(ctx context.Context, e *entity.Entity) error {
	for i, item := range m.entities {
		if item.ID == e.ID {
			m.entities[i] = *e
			return nil
		}
	}
	return repository.ErrEntityNotFound
}

func (m *mockEntityRepo) Delete(ctx context.Context, id string) error {
	for i, item := range m.entities {
		if item.ID == id {
			m.entities = append(m.entities[:i], m.entities[i+1:]...)
			return nil
		}
	}
	return repository.ErrEntityNotFound
}

type mockEntityTypeRepo struct {
	types map[string]entity.EntityType
}

func (m *mockEntityTypeRepo) FindAll(ctx context.Context) ([]entity.EntityType, error) {
	var list []entity.EntityType
	for _, v := range m.types {
		list = append(list, v)
	}
	return list, nil
}

func (m *mockEntityTypeRepo) FindByCode(ctx context.Context, code string) (*entity.EntityType, error) {
	t, ok := m.types[code]
	if !ok {
		return nil, repository.ErrEntityTypeNotFound
	}
	return &t, nil
}

func (m *mockEntityTypeRepo) Create(ctx context.Context, et *entity.EntityType) error {
	m.types[et.Code] = *et
	return nil
}

func (m *mockEntityTypeRepo) Update(ctx context.Context, et *entity.EntityType) error {
	m.types[et.Code] = *et
	return nil
}

func (m *mockEntityTypeRepo) Delete(ctx context.Context, code string) error {
	delete(m.types, code)
	return nil
}

func TestEntityUsecase_Create(t *testing.T) {
	repo := &mockEntityRepo{}
	typeRepo := &mockEntityTypeRepo{
		types: map[string]entity.EntityType{
			"VEHICLE": {Code: "VEHICLE", Name: "Vehicle"},
		},
	}

	uc := usecase.NewEntityUsecase(repo, typeRepo)

	t.Run("successful create with valid type", func(t *testing.T) {
		dto := entity.EntityPayloadDTO{
			Name:      "Patrol Unit A",
			Type:      "VEHICLE",
			Status:    "ACTIVE",
			Latitude:  -6.9175,
			Longitude: 107.6191,
			Metadata:  json.RawMessage(`{"battery": 88}`),
		}

		created, err := uc.Create(context.Background(), dto)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if created.ID == "" {
			t.Errorf("expected generated UUID, got empty")
		}
		if created.Name != dto.Name {
			t.Errorf("expected name %s, got %s", dto.Name, created.Name)
		}
	})

	t.Run("fails create when type does not exist in master data", func(t *testing.T) {
		dto := entity.EntityPayloadDTO{
			Name:      "Ghost Unit",
			Type:      "NON_EXISTENT",
			Status:    "ACTIVE",
			Latitude:  -6.9175,
			Longitude: 107.6191,
		}

		_, err := uc.Create(context.Background(), dto)
		if err == nil {
			t.Fatalf("expected error for non-existent type, got nil")
		}
	})
}

func TestEntityUsecase_GetByID_NotFound(t *testing.T) {
	repo := &mockEntityRepo{}
	typeRepo := &mockEntityTypeRepo{types: map[string]entity.EntityType{}}
	uc := usecase.NewEntityUsecase(repo, typeRepo)

	_, err := uc.GetByID(context.Background(), "unknown-id")
	if !errors.Is(err, repository.ErrEntityNotFound) {
		t.Fatalf("expected ErrEntityNotFound, got %v", err)
	}
}
