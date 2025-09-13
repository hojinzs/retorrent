package migrations

import (
	"log"
	"sort"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		// Add the 'role' field to the collection's schema
		collection.Fields.Add(&core.SelectField{
			Name:     "role",
			Required: false,
			Values:   []string{"user", "admin"},
		})

		// Save the updated collection schema
		if err := app.Save(collection); err != nil {
			return err
		}

		// --- Grant "admin" role to the first created user ---

		// 1. Fetch all user records.
		records, err := app.FindRecordsByFilter(
			collection,
			"1=1", // filter
			"",    // sort
			0,     // limit
			0,     // offset
			nil,   // params
		)
		if err != nil {
			return err
		}

		if len(records) == 0 {
			log.Println("No users found to grant admin role, skipping.")
			return nil
		}

		// 2. Sort the records in Go by their creation date.
		sort.Slice(records, func(i, j int) bool {
			// CORRECTED: Get the standard time.Time object from both records and then use the standard Before method.
			timeI := records[i].GetDateTime("created").Time()
			timeJ := records[j].GetDateTime("created").Time()
			return timeI.Before(timeJ)
		})

		// 3. The first record in the sorted slice is the one to update.
		recordToUpdate := records[0]

		recordToUpdate.Set("role", "admin")
		username := recordToUpdate.GetString("username")
		log.Printf("Attempting to grant admin role to user: %s", username)

		// Save the change to the user record
		if err := app.Save(recordToUpdate); err != nil {
			log.Printf("Failed to grant admin role to user %s: %v", username, err)
			return err
		}

		log.Printf("Successfully granted admin role to user: %s", username)
		return nil
	}, func(app core.App) error {
		// --- Fallback/Down migration ---
		log.Println("Rolling back '1757482100_add_role_to_users' requires manual removal of the 'role' field from the 'users' collection via the Admin UI.")
		return nil
	})
}
