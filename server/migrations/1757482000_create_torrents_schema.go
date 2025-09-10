package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"

	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		collection := core.NewBaseCollection("torrents")

		// View rule: authenticated users can see all torrents
		collection.ViewRule = types.Pointer("@request.auth.id != ''")
		// Create rule: authenticated users can create torrents
		collection.CreateRule = types.Pointer("@request.auth.id != ''")
		// Update rule: only admins or system can update torrents (sync service)
		collection.UpdateRule = types.Pointer("@request.auth.role = 'admin'")
		// Delete rule: only admins can delete torrents
		collection.DeleteRule = types.Pointer("@request.auth.role = 'admin'")

		// Basic torrent information
		collection.Fields.Add(&core.NumberField{
			Name:     "transmissionId",
			Required: true,
		})

		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
			Max:      500,
		})

		collection.Fields.Add(&core.TextField{
			Name:     "hash",
			Required: true,
			Max:      255,
		})

		collection.Fields.Add(&core.SelectField{
			Name:     "status",
			Required: true,
			Values: []string{
				"stopped",
				"checkWait", 
				"check",
				"downloadWait",
				"download",
				"seedWait",
				"seed",
				"removed",
			},
		})

		// Progress and size information
		collection.Fields.Add(&core.NumberField{
			Name:     "percentDone",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "sizeWhenDone",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "totalSize",
			Required: false,
		})

		// Transfer rates
		collection.Fields.Add(&core.NumberField{
			Name:     "rateDownload",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "rateUpload",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "uploadRatio",
			Required: false,
		})

		// Time information
		collection.Fields.Add(&core.NumberField{
			Name:     "eta",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "downloadedEver",
			Required: false,
		})

		collection.Fields.Add(&core.NumberField{
			Name:     "uploadedEver",
			Required: false,
		})

		collection.Fields.Add(&core.DateField{
			Name:     "addedDate",
			Required: false,
		})

		collection.Fields.Add(&core.DateField{
			Name:     "doneDate",
			Required: false,
		})

		// Error information
		collection.Fields.Add(&core.TextField{
			Name:     "error",
			Required: false,
			Max:      500,
		})

		collection.Fields.Add(&core.TextField{
			Name:     "errorString",
			Required: false,
			Max:      1000,
		})

		// Store full transmission data as JSON for extensibility
		collection.Fields.Add(&core.JSONField{
			Name:     "transmissionData",
			Required: false,
		})

		// Add user relation (who added this torrent)
		usersCollection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		collection.Fields.Add(&core.RelationField{
			Name:          "user",
			Required:      false, // System sync can create without user
			CascadeDelete: false,
			CollectionId:  usersCollection.Id,
		})

		// Add indexes for performance
		collection.AddIndex("idx_torrents_hash", true, "hash", "")
		collection.AddIndex("idx_torrents_transmission_id", false, "transmissionId", "")
		collection.AddIndex("idx_torrents_status", false, "status", "")
		collection.AddIndex("idx_torrents_user", false, "user", "")

		// Add autodate/timestamp fields (created/updated)
		collection.Fields.Add(&core.AutodateField{
			Name:     "created",
			OnCreate: true,
		})
		collection.Fields.Add(&core.AutodateField{
			Name:     "updated",
			OnCreate: true,
			OnUpdate: true,
		})

		// validate and persist
		return app.Save(collection)

	}, func(app core.App) error {

		collection, err := app.FindCollectionByNameOrId("torrents")

		if err != nil {
			return err
		}

		return app.Delete(collection)

	})
}