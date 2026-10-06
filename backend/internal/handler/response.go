package handler

import (
	"encoding/json"
	"net/http"
)

// envelope is the standard JSON response wrapper for all API endpoints.
type envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Error   string      `json:"error,omitempty"`
}

// writeJSON writes the payload as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// respondSuccess writes a success envelope. data may be nil (serialised as JSON null).
func respondSuccess(w http.ResponseWriter, status int, message string, data interface{}) {
	writeJSON(w, status, envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// respondError writes an error envelope with data: null.
func respondError(w http.ResponseWriter, status int, message, errDetail string) {
	writeJSON(w, status, envelope{
		Success: false,
		Message: message,
		Data:    nil,
		Error:   errDetail,
	})
}
