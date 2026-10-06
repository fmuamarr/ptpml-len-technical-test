package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"geo-entities-backend/internal/handler"
	"geo-entities-backend/internal/repository"
	"geo-entities-backend/internal/usecase"
	appvalidator "geo-entities-backend/pkg/validator"
)

func main() {
	// Load .env file if present; ignore error when running in environments
	// where variables are already exported (e.g., Docker, CI).
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// ── Configuration ───────────────────────────────────────────────────────
	dsn := getenv("DATABASE_URL", "postgres://postgres:lentechtest@localhost:5432/geo_entities?sslmode=disable")
	port := getenv("PORT", "8080")

	// ── Database ─────────────────────────────────────────────────────────────
	db, err := sqlx.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	// Configure connection pool following best practices.
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	// Verify the database is reachable before serving traffic.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Cannot reach PostgreSQL: %v", err)
	}
	log.Println("Connected to PostgreSQL successfully")

	// ── Validator ────────────────────────────────────────────────────────────
	validate, err := appvalidator.New()
	if err != nil {
		log.Fatalf("Failed to initialise validator: %v", err)
	}

	// ── Dependency injection: Repository → Usecase → Handler ─────────────────

	// Entity Types (master data) — must be wired before entities so that the
	// entity usecase can perform dynamic type validation.
	entityTypeRepo := repository.NewPostgresEntityTypeRepository(db)
	entityTypeUC := usecase.NewEntityTypeUsecase(entityTypeRepo)
	entityTypeHandler := handler.NewEntityTypeHandler(entityTypeUC, validate)

	// Entities — passes entityTypeRepo for dynamic type validation.
	entityRepo := repository.NewPostgresEntityRepository(db)
	entityUC := usecase.NewEntityUsecase(entityRepo, entityTypeRepo)
	entityHandler := handler.NewEntityHandler(entityUC, validate, func() error {
		pingCtx, pingCancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer pingCancel()
		return db.PingContext(pingCtx)
	})

	// ── Router ───────────────────────────────────────────────────────────────
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// ── Routes ───────────────────────────────────────────────────────────────
	r.Get("/health", entityHandler.Health)

	r.Route("/api/v1", func(r chi.Router) {
		// Entity types master data endpoints
		r.Route("/entity-types", func(r chi.Router) {
			r.Get("/", entityTypeHandler.GetAll)
			r.Post("/", entityTypeHandler.Create)
			r.Get("/{code}", entityTypeHandler.GetByCode)
			r.Put("/{code}", entityTypeHandler.Update)
			r.Delete("/{code}", entityTypeHandler.Delete)
		})

		// Entities CRUD endpoints
		r.Route("/entities", func(r chi.Router) {
			r.Get("/", entityHandler.GetAll)
			r.Post("/", entityHandler.Create)
			r.Get("/{id}", entityHandler.GetByID)
			r.Put("/{id}", entityHandler.Update)
			r.Delete("/{id}", entityHandler.Delete)
		})
	})

	// ── HTTP Server ───────────────────────────────────────────────────────────
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Starting server on %s", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

// getenv returns the environment variable value for key, or fallback when unset.
func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
