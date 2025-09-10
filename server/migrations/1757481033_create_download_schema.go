package migrations

import (
    "github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"

	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

        collection := core.NewBaseCollection("downloads")

        collection.ViewRule = types.Pointer(`
          @request.auth.id != '' &&
          (user = @request.auth.id || @request.auth.role = 'admin')
        `)
        collection.CreateRule = types.Pointer("@request.auth.id != ''")
        collection.UpdateRule = types.Pointer(`
          @request.auth.id != '' &&
          (user = @request.auth.id || @request.auth.role = 'admin')
        `)
        collection.DeleteRule = types.Pointer(`
          @request.auth.id != '' &&
          (user = @request.auth.id || @request.auth.role = 'admin')
        `)

        collection.Fields.Add(&core.TextField{
            Name:     "name",
            Required: true,
            Max:      100,
        })
        collection.Fields.Add(&core.TextField{
            Name:     "hash",
            Required: true,
            Max:      255,
        })

        // add relation field
        usersCollection, err := app.FindCollectionByNameOrId("users")
        if err != nil {
            return err
        }
        collection.Fields.Add(&core.RelationField{
            Name:          "user",
            Required:      true,
            CascadeDelete: true,
            CollectionId:  usersCollection.Id,
        })
        collection.AddIndex("idx_downloads_user", true, "user", "")

        // add autodate/timestamp fields (created/updated)
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
        // (use SaveNoValidate to skip fields validation)
        return app.Save(collection)

	}, func(app core.App) error {

        collection, err := app.FindCollectionByNameOrId("downloads")

        if err != nil {
            return err
        }

        return app.Delete(collection)

	})
}
