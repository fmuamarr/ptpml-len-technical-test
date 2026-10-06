package validator

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

// New returns a *validator.Validate instance with custom geographic validators registered.
func New() (*validator.Validate, error) {
	v := validator.New()

	// latitude: valid range is [-90.0, 90.0]
	if err := v.RegisterValidation("latitude", validateLatitude); err != nil {
		return nil, fmt.Errorf("registering latitude validator: %w", err)
	}

	// longitude: valid range is [-180.0, 180.0]
	if err := v.RegisterValidation("longitude", validateLongitude); err != nil {
		return nil, fmt.Errorf("registering longitude validator: %w", err)
	}

	return v, nil
}

func validateLatitude(fl validator.FieldLevel) bool {
	lat := fl.Field().Float()
	return lat >= -90.0 && lat <= 90.0
}

func validateLongitude(fl validator.FieldLevel) bool {
	lon := fl.Field().Float()
	return lon >= -180.0 && lon <= 180.0
}
