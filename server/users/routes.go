package users

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type userResponse struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Role            string `json:"role"`
	Verified        bool   `json:"verified"`
	EmailVisibility bool   `json:"emailVisibility"`
	Created         string `json:"created"`
	Updated         string `json:"updated"`
}

var allowedRoles = map[string]struct{}{
	"admin": {},
	"user":  {},
}

func normalizeRole(role string) (string, bool) {
	cleaned := strings.ToLower(strings.TrimSpace(role))
	if cleaned == "" {
		return "user", true
	}

	if _, ok := allowedRoles[cleaned]; ok {
		return cleaned, true
	}

	return "", false
}

func mapUserRecord(record *core.Record) userResponse {
	created := record.GetDateTime("created").Time()
	updated := record.GetDateTime("updated").Time()

	roleValue, ok := normalizeRole(record.GetString("role"))
	if !ok {
		roleValue = "user"
	}

	name := record.GetString("name")

	return userResponse{
		ID:              record.Id,
		Name:            name,
		Email:           record.GetString("email"),
		Role:            roleValue,
		Verified:        record.GetBool("verified"),
		EmailVisibility: record.GetBool("emailVisibility"),
		Created:         created.Format(time.RFC3339),
		Updated:         updated.Format(time.RFC3339),
	}
}

func errorResponse(re *core.RequestEvent, status int, message string) error {
	return re.JSON(status, map[string]string{"error": message})
}

func listUsersHandler(app *pocketbase.PocketBase) func(*core.RequestEvent) error {
	return func(re *core.RequestEvent) error {
		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return errorResponse(re, http.StatusInternalServerError, "Failed to access users collection")
		}

		records, err := app.FindRecordsByFilter(
			collection,
			"1=1",
			"created",
			0,
			0,
			nil,
		)
		if err != nil {
			return errorResponse(re, http.StatusInternalServerError, "Failed to fetch users")
		}

		for _, record := range records {
			log.Printf("record export: %+v", record)
		}

		users := make([]userResponse, 0, len(records))
		for _, record := range records {
			users = append(users, mapUserRecord(record))
		}

		return re.JSON(http.StatusOK, map[string]any{"users": users})
	}
}

type createUserRequest struct {
	Name            string `json:"name"`
	Username        string `json:"username"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	Role            string `json:"role"`
	Verified        bool   `json:"verified"`
	EmailVisibility bool   `json:"emailVisibility"`
}

func createUserHandler(app *pocketbase.PocketBase) func(*core.RequestEvent) error {
	return func(re *core.RequestEvent) error {
		var payload createUserRequest
		if err := re.BindBody(&payload); err != nil {
			return errorResponse(re, http.StatusBadRequest, "Invalid request data")
		}

		name := strings.TrimSpace(payload.Name)
		if name == "" {
			name = strings.TrimSpace(payload.Username)
		}

		email := strings.TrimSpace(payload.Email)
		password := strings.TrimSpace(payload.Password)

		if name == "" || email == "" || password == "" {
			return errorResponse(re, http.StatusBadRequest, "Name, email, and password are required")
		}

		if len(password) < 8 {
			return errorResponse(re, http.StatusBadRequest, "Password must be at least 8 characters long")
		}

		roleValue, ok := normalizeRole(payload.Role)
		if !ok {
			return errorResponse(re, http.StatusBadRequest, "Invalid role provided")
		}

		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return errorResponse(re, http.StatusInternalServerError, "Failed to access users collection")
		}

		record := core.NewRecord(collection)
		record.Set("name", name)
		record.Set("email", email)
		record.Set("role", roleValue)
		record.Set("verified", payload.Verified)
		record.Set("emailVisibility", payload.EmailVisibility)
		record.SetPassword(password)

		if err := app.Save(record); err != nil {
			log.Printf("Failed to create user %q: %v", name, err)
			return errorResponse(re, http.StatusBadRequest, "Failed to create user")
		}

		return re.JSON(http.StatusCreated, map[string]any{"user": mapUserRecord(record)})
	}
}

type updateUserRequest struct {
	Name            *string `json:"name"`
	Username        *string `json:"username"`
	Email           *string `json:"email"`
	Password        *string `json:"password"`
	Role            *string `json:"role"`
	Verified        *bool   `json:"verified"`
	EmailVisibility *bool   `json:"emailVisibility"`
}

func updateUserHandler(app *pocketbase.PocketBase) func(*core.RequestEvent) error {
	return func(re *core.RequestEvent) error {
		userID := re.Request.PathValue("id")
		if strings.TrimSpace(userID) == "" {
			return errorResponse(re, http.StatusBadRequest, "User ID is required")
		}

		var payload updateUserRequest
		if err := re.BindBody(&payload); err != nil {
			return errorResponse(re, http.StatusBadRequest, "Invalid request data")
		}

		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return errorResponse(re, http.StatusInternalServerError, "Failed to access users collection")
		}

		record, err := app.FindRecordById(collection, userID, nil)
		if err != nil {
			return errorResponse(re, http.StatusNotFound, "User not found")
		}

		if payload.Name != nil || payload.Username != nil {
			var name string

			if payload.Name != nil {
				name = strings.TrimSpace(*payload.Name)
			} else if payload.Username != nil {
				name = strings.TrimSpace(*payload.Username)
			}

			if name == "" {
				return errorResponse(re, http.StatusBadRequest, "Name cannot be empty")
			}

			record.Set("name", name)
		}

		if payload.Email != nil {
			email := strings.TrimSpace(*payload.Email)
			if email == "" {
				return errorResponse(re, http.StatusBadRequest, "Email cannot be empty")
			}
			record.Set("email", email)
		}

		if payload.Password != nil {
			password := strings.TrimSpace(*payload.Password)
			if password != "" {
				if len(password) < 8 {
					return errorResponse(re, http.StatusBadRequest, "Password must be at least 8 characters long")
				}
				record.SetPassword(password)
			}
		}

		if payload.Role != nil {
			roleValue, ok := normalizeRole(*payload.Role)
			if !ok {
				return errorResponse(re, http.StatusBadRequest, "Invalid role provided")
			}
			record.Set("role", roleValue)
		}

		if payload.Verified != nil {
			record.Set("verified", *payload.Verified)
		}

		if payload.EmailVisibility != nil {
			record.Set("emailVisibility", *payload.EmailVisibility)
		}

		if err := app.Save(record); err != nil {
			log.Printf("Failed to update user %q: %v", record.Id, err)
			return errorResponse(re, http.StatusBadRequest, "Failed to update user")
		}

		return re.JSON(http.StatusOK, map[string]any{"user": mapUserRecord(record)})
	}
}

// RegisterRoutes attaches user-related API routes to the server router.
func RegisterRoutes(app *pocketbase.PocketBase, se *core.ServeEvent) {
	se.Router.GET("/api/users", listUsersHandler(app))
	se.Router.POST("/api/users", createUserHandler(app))
	se.Router.PATCH("/api/users/{id}", updateUserHandler(app))

	// Check if admin account exists (for initial setup)
	se.Router.GET("/api/admin/exists", func(re *core.RequestEvent) error {
		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return re.JSON(500, map[string]string{"error": "Failed to access users collection"})
		}

		// Check if any user with admin role exists
		records, err := app.FindRecordsByFilter(
			collection,
			"role = 'admin'",
			"",
			1, // limit to 1 since we just need to check existence
			0, // offset
			nil,
		)
		if err != nil {
			return re.JSON(500, map[string]string{"error": "Failed to check admin users"})
		}

		adminExists := len(records) > 0
		return re.JSON(200, map[string]bool{"adminExists": adminExists})
	})

	// Create initial admin account
	se.Router.POST("/api/admin/setup", func(re *core.RequestEvent) error {
		// First, check if admin already exists
		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return re.JSON(500, map[string]string{"error": "Failed to access users collection"})
		}

		records, err := app.FindRecordsByFilter(
			collection,
			"role = 'admin'",
			"",
			1,
			0,
			nil,
		)
		if err != nil {
			return re.JSON(500, map[string]string{"error": "Failed to check existing admin users"})
		}

		if len(records) > 0 {
			return re.JSON(400, map[string]string{"error": "Admin account already exists"})
		}

		// Parse request data
		var data struct {
			Name     string `json:"name"`
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := re.BindBody(&data); err != nil {
			return re.JSON(400, map[string]string{"error": "Invalid request data"})
		}

		// Validate input
		name := data.Name
		if name == "" {
			name = data.Username
		}

		if name == "" || data.Email == "" || data.Password == "" {
			return re.JSON(400, map[string]string{"error": "Name, email, and password are required"})
		}

		if len(data.Password) < 8 {
			return re.JSON(400, map[string]string{"error": "Password must be at least 8 characters long"})
		}

		// Create new admin user record
		record := core.NewRecord(collection)
		record.Set("name", name)
		record.Set("email", data.Email)
		record.Set("role", "admin")
		record.Set("emailVisibility", false)
		record.Set("verified", true)

		// Set password (PocketBase handles hashing automatically)
		record.SetPassword(data.Password)

		// Save the user record
		if err := app.Save(record); err != nil {
			return re.JSON(500, map[string]string{"error": "Failed to create admin user"})
		}

		if err := CreatePocketbaseAdmin(app, data.Email, data.Password); err != nil {
			return re.JSON(500, map[string]string{"error": err.Error()})
		}

		log.Printf("Initial admin user created: %s (%s)", name, data.Email)

		return re.JSON(201, map[string]string{"message": "Admin account created successfully"})
	})
}
