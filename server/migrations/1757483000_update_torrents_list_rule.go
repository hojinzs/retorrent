package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("torrents")
		if err != nil {
			return err
		}

		// Allow users with the 'admin' role to list all torrents
		collection.ListRule = types.Pointer("@request.auth.role = 'admin'")

		return app.Save(collection)
	}, func(app core.App) error {
		// Fallback (down) migration
		collection, err := app.FindCollectionByNameOrId("torrents")
		if err != nil {
			return err
		}

		collection.ListRule = nil // Revert to default (locked)

		return app.Save(collection)
	})
}
