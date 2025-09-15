package users

import (
    "log"

    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

// RegisterRoutes attaches user-related API routes to the server router.
func RegisterRoutes(app *pocketbase.PocketBase, se *core.ServeEvent) {
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
            Username string `json:"username"`
            Email    string `json:"email"`
            Password string `json:"password"`
        }

        if err := re.BindBody(&data); err != nil {
            return re.JSON(400, map[string]string{"error": "Invalid request data"})
        }

        // Validate input
        if data.Username == "" || data.Email == "" || data.Password == "" {
            return re.JSON(400, map[string]string{"error": "Username, email, and password are required"})
        }

        if len(data.Password) < 8 {
            return re.JSON(400, map[string]string{"error": "Password must be at least 8 characters long"})
        }

        // Create new admin user record
        record := core.NewRecord(collection)
        record.Set("username", data.Username)
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

        log.Printf("Initial admin user created: %s (%s)", data.Username, data.Email)

        return re.JSON(201, map[string]string{"message": "Admin account created successfully"})
    })
}
