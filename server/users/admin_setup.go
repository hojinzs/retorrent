//go:build !pbadm

package users

import (
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/core"
)

// CreatePocketbaseAdmin creates a superuser using the provided email/password
// without requiring the models package, so it works without any build tags.
func CreatePocketbaseAdmin(app *pocketbase.PocketBase, email, password string) error {
    collection, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
    if err != nil {
        return err
    }

    adminUser := core.NewRecord(collection)
    adminUser.SetEmail(email)
    adminUser.SetPassword(password)

    if err := app.Save(adminUser); err != nil {
        return err
    }

    return nil
}
