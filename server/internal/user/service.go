package user

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var allowedRoles = map[string]struct{}{
	"admin": {},
	"user":  {},
}

// Service provides higher level helpers around PocketBase's user collection.
type Service struct {
	app *pocketbase.PocketBase
}

// NewService constructs a Service instance.
func NewService(app *pocketbase.PocketBase) *Service {
	return &Service{app: app}
}

// Response represents the subset of user information exposed by the API.
type Response struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	Role            string `json:"role"`
	Verified        bool   `json:"verified"`
	EmailVisibility bool   `json:"emailVisibility"`
	Created         string `json:"created"`
	Updated         string `json:"updated"`
}

// CreateParams holds the data required to create a new user.
type CreateParams struct {
	Name            string
	Username        string
	Email           string
	Password        string
	Role            string
	Verified        bool
	EmailVisibility bool
}

// UpdateParams holds the optional data that can be updated on a user record.
type UpdateParams struct {
	Name            *string
	Username        *string
	Email           *string
	Password        *string
	Role            *string
	Verified        *bool
	EmailVisibility *bool
}

// AdminSetupParams contains the payload for creating the initial admin user.
type AdminSetupParams struct {
	Name     string
	Username string
	Email    string
	Password string
}

// ValidationError indicates that the provided data is invalid for the requested action.
type ValidationError struct {
	Message string
}

func (e ValidationError) Error() string {
	return e.Message
}

// NotFoundError indicates that a resource was not found.
type NotFoundError struct {
	Message string
}

func (e NotFoundError) Error() string {
	return e.Message
}

var ErrAdminAlreadyExists = errors.New("admin account already exists")

func normalizeRole(role string) (string, bool) {
	cleaned := strings.ToLower(strings.TrimSpace(role))
	if cleaned == "" {
		return "user", true
	}

	_, ok := allowedRoles[cleaned]
	return cleaned, ok
}

func mapUserRecord(record *core.Record) Response {
	created := record.GetDateTime("created").Time()
	updated := record.GetDateTime("updated").Time()

	roleValue, ok := normalizeRole(record.GetString("role"))
	if !ok {
		roleValue = "user"
	}

	return Response{
		ID:              record.Id,
		Name:            record.GetString("name"),
		Email:           record.GetString("email"),
		Role:            roleValue,
		Verified:        record.GetBool("verified"),
		EmailVisibility: record.GetBool("emailVisibility"),
		Created:         created.Format(time.RFC3339),
		Updated:         updated.Format(time.RFC3339),
	}
}

func (s *Service) userCollection() (*core.Collection, error) {
	return s.app.FindCollectionByNameOrId("users")
}

// List returns all user records.
func (s *Service) List() ([]Response, error) {
	collection, err := s.userCollection()
	if err != nil {
		return nil, fmt.Errorf("find users collection: %w", err)
	}

	records, err := s.app.FindRecordsByFilter(collection, "1=1", "created", 0, 0, nil)
	if err != nil {
		return nil, fmt.Errorf("find users: %w", err)
	}

	responses := make([]Response, 0, len(records))
	for _, record := range records {
		responses = append(responses, mapUserRecord(record))
	}

	return responses, nil
}

// Create inserts a new user record.
func (s *Service) Create(params CreateParams) (Response, error) {
	name := strings.TrimSpace(params.Name)
	if name == "" {
		name = strings.TrimSpace(params.Username)
	}

	email := strings.TrimSpace(params.Email)
	password := strings.TrimSpace(params.Password)

	if name == "" || email == "" || password == "" {
		return Response{}, ValidationError{Message: "name, email, and password are required"}
	}

	if len(password) < 8 {
		return Response{}, ValidationError{Message: "password must be at least 8 characters long"}
	}

	roleValue, ok := normalizeRole(params.Role)
	if !ok {
		return Response{}, ValidationError{Message: "invalid role provided"}
	}

	collection, err := s.userCollection()
	if err != nil {
		return Response{}, fmt.Errorf("find users collection: %w", err)
	}

	record := core.NewRecord(collection)
	record.Set("name", name)
	record.Set("email", email)
	record.Set("role", roleValue)
	record.Set("verified", params.Verified)
	record.Set("emailVisibility", params.EmailVisibility)
	record.SetPassword(password)

	if err := s.app.Save(record); err != nil {
		return Response{}, fmt.Errorf("save user: %w", err)
	}

	return mapUserRecord(record), nil
}

// Update applies partial updates to a user record by ID.
func (s *Service) Update(id string, params UpdateParams) (Response, error) {
	if strings.TrimSpace(id) == "" {
		return Response{}, ValidationError{Message: "user id is required"}
	}

	collection, err := s.userCollection()
	if err != nil {
		return Response{}, fmt.Errorf("find users collection: %w", err)
	}

	record, err := s.app.FindRecordById(collection, id, nil)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Response{}, NotFoundError{Message: "user not found"}
		}
		return Response{}, fmt.Errorf("find user: %w", err)
	}

	if params.Name != nil || params.Username != nil {
		var name string
		if params.Name != nil {
			name = strings.TrimSpace(*params.Name)
		} else {
			name = strings.TrimSpace(*params.Username)
		}

		if name == "" {
			return Response{}, ValidationError{Message: "name cannot be empty"}
		}

		record.Set("name", name)
	}

	if params.Email != nil {
		email := strings.TrimSpace(*params.Email)
		if email == "" {
			return Response{}, ValidationError{Message: "email cannot be empty"}
		}
		record.Set("email", email)
	}

	if params.Password != nil {
		password := strings.TrimSpace(*params.Password)
		if password != "" {
			if len(password) < 8 {
				return Response{}, ValidationError{Message: "password must be at least 8 characters long"}
			}
			record.SetPassword(password)
		}
	}

	if params.Role != nil {
		roleValue, ok := normalizeRole(*params.Role)
		if !ok {
			return Response{}, ValidationError{Message: "invalid role provided"}
		}
		record.Set("role", roleValue)
	}

	if params.Verified != nil {
		record.Set("verified", *params.Verified)
	}

	if params.EmailVisibility != nil {
		record.Set("emailVisibility", *params.EmailVisibility)
	}

	if err := s.app.Save(record); err != nil {
		return Response{}, fmt.Errorf("save user: %w", err)
	}

	return mapUserRecord(record), nil
}

// AdminExists determines whether an admin user already exists.
func (s *Service) AdminExists() (bool, error) {
	collection, err := s.userCollection()
	if err != nil {
		return false, fmt.Errorf("find users collection: %w", err)
	}

	records, err := s.app.FindRecordsByFilter(collection, "role = 'admin'", "", 1, 0, nil)
	if err != nil {
		return false, fmt.Errorf("find admin users: %w", err)
	}

	return len(records) > 0, nil
}

// SetupInitialAdmin creates the first admin user and PocketBase superuser.
func (s *Service) SetupInitialAdmin(params AdminSetupParams) error {
	exists, err := s.AdminExists()
	if err != nil {
		return err
	}

	if exists {
		return ErrAdminAlreadyExists
	}

	name := strings.TrimSpace(params.Name)
	if name == "" {
		name = strings.TrimSpace(params.Username)
	}

	email := strings.TrimSpace(params.Email)
	password := strings.TrimSpace(params.Password)

	if name == "" || email == "" || password == "" {
		return ValidationError{Message: "name, email, and password are required"}
	}

	if len(password) < 8 {
		return ValidationError{Message: "password must be at least 8 characters long"}
	}

	collection, err := s.userCollection()
	if err != nil {
		return fmt.Errorf("find users collection: %w", err)
	}

	record := core.NewRecord(collection)
	record.Set("name", name)
	record.Set("email", email)
	record.Set("role", "admin")
	record.Set("emailVisibility", false)
	record.Set("verified", true)
	record.SetPassword(password)

	if err := s.app.Save(record); err != nil {
		return fmt.Errorf("save admin user: %w", err)
	}

	if err := CreatePocketbaseAdmin(s.app, email, password); err != nil {
		return fmt.Errorf("create pocketbase admin: %w", err)
	}

	return nil
}
