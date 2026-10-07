package validator_test

import (
	"testing"

	appvalidator "geo-entities-backend/pkg/validator"
)

type testCoord struct {
	Latitude  float64 `validate:"latitude"`
	Longitude float64 `validate:"longitude"`
}

func TestCoordinateValidation(t *testing.T) {
	v, err := appvalidator.New()
	if err != nil {
		t.Fatalf("expected no error creating validator, got %v", err)
	}

	tests := []struct {
		name      string
		lat       float64
		lon       float64
		expectErr bool
	}{
		{"valid bandung coordinates", -6.917464, 107.619123, false},
		{"valid equator and prime meridian", 0.0, 0.0, false},
		{"valid bounds", 90.0, 180.0, false},
		{"valid negative bounds", -90.0, -180.0, false},
		{"invalid latitude too high", 90.0001, 107.0, true},
		{"invalid latitude too low", -90.0001, 107.0, true},
		{"invalid longitude too high", 10.0, 180.0001, true},
		{"invalid longitude too low", 10.0, -180.0001, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			input := testCoord{Latitude: tc.lat, Longitude: tc.lon}
			err := v.Struct(input)
			if tc.expectErr && err == nil {
				t.Errorf("expected validation error for lat=%f, lon=%f, got none", tc.lat, tc.lon)
			}
			if !tc.expectErr && err != nil {
				t.Errorf("expected valid for lat=%f, lon=%f, got %v", tc.lat, tc.lon, err)
			}
		})
	}
}
