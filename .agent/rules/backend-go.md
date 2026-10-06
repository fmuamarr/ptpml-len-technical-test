# Backend Go Architecture & Best Practices

## Context
- Developer is proficient in Laravel for API server backend and transitioning to idiomatic Go.
- Use explicit dependency injection: Handler -> Usecase -> Repository -> DB.
- Router: Chi v5 (idiomatic net/http).
- Query & Mapping: sqlx with raw SQL ($1, $2 bind parameters).
- Validation: go-playground/validator/v10.
- Error handling: explicit `if err != nil`, always return standardized JSON envelope:
  `{"success": boolean, "data": ..., "error": "string"}`

## Coordinate Validation
- Latitude: [-90.0, 90.0]
- Longitude: [-180.0, 180.0]
