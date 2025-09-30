package routes

import (
	"github.com/pocketbase/pocketbase/core"

	"backend/internal/transmission"
)

// PreferenceRoutes handles preference-related HTTP routes
type PreferenceRoutes struct {
	client transmission.TransmissionClient
}

// NewPreferenceRoutes creates a new preference routes handler
func NewPreferenceRoutes(client transmission.TransmissionClient) *PreferenceRoutes {
	return &PreferenceRoutes{
		client: client,
	}
}

// RegisterRoutes registers preference-related routes
func (pr *PreferenceRoutes) RegisterRoutes(se *core.ServeEvent) {
	// API endpoint to get preferences/settings
	se.Router.GET("/api/preferences", pr.handleGetPreferences)

	// API endpoint to update preferences/settings
	se.Router.POST("/api/preferences", pr.handleSetPreferences)
}

// handleGetPreferences handles GET /api/preferences requests
func (pr *PreferenceRoutes) handleGetPreferences(re *core.RequestEvent) error {
	ctx := re.Request.Context()
	
	settings, err := pr.client.GetSessionSettings(ctx)
	if err != nil {
		return re.JSON(500, map[string]string{"error": err.Error()})
	}

	return re.JSON(200, map[string]interface{}{
		"success": true,
		"data":    settings,
	})
}

// handleSetPreferences handles POST /api/preferences requests
func (pr *PreferenceRoutes) handleSetPreferences(re *core.RequestEvent) error {
	// Parse request body
	var requestBody map[string]interface{}

	if err := re.BindBody(&requestBody); err != nil {
		return re.JSON(400, map[string]string{"error": "Invalid request body"})
	}

	// Extract settings from request
	settings, ok := requestBody["settings"].(map[string]interface{})
	if !ok {
		return re.JSON(400, map[string]string{"error": "Invalid settings format"})
	}

	// Update settings using transmission client
	ctx := re.Request.Context()
	if err := pr.client.SetSessionSettings(ctx, settings); err != nil {
		return re.JSON(500, map[string]string{"error": err.Error()})
	}

	return re.JSON(200, map[string]interface{}{
		"success": true,
		"message": "Preferences updated successfully",
	})
}