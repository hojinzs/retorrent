package routes

import (
	"errors"
	"log"
	"net/http"

	"github.com/pocketbase/pocketbase/core"

	"backend/internal/user"
)

// UserRoutes handles user-related HTTP routes.
type UserRoutes struct {
	service *user.Service
}

// NewUserRoutes constructs a new UserRoutes instance.
func NewUserRoutes(service *user.Service) *UserRoutes {
	return &UserRoutes{service: service}
}

// RegisterRoutes binds user-related routes to the router.
func (ur *UserRoutes) RegisterRoutes(se *core.ServeEvent) {
	se.Router.GET("/api/users", ur.listUsers)
	se.Router.POST("/api/users", ur.createUser)
	se.Router.PATCH("/api/users/{id}", ur.updateUser)

	se.Router.GET("/api/admin/exists", ur.adminExists)
	se.Router.POST("/api/admin/setup", ur.setupAdmin)
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

func (ur *UserRoutes) listUsers(re *core.RequestEvent) error {
	users, err := ur.service.List()
	if err != nil {
		log.Printf("list users: %v", err)
		return re.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch users"})
	}

	return re.JSON(http.StatusOK, map[string]any{"users": users})
}

func (ur *UserRoutes) createUser(re *core.RequestEvent) error {
	var req createUserRequest
	if err := re.BindBody(&req); err != nil {
		return re.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request data"})
	}

	userResp, err := ur.service.Create(user.CreateParams{
		Name:            req.Name,
		Username:        req.Username,
		Email:           req.Email,
		Password:        req.Password,
		Role:            req.Role,
		Verified:        req.Verified,
		EmailVisibility: req.EmailVisibility,
	})
	if err != nil {
		return ur.handleServiceError(re, err)
	}

	return re.JSON(http.StatusCreated, map[string]any{"user": userResp})
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

func (ur *UserRoutes) updateUser(re *core.RequestEvent) error {
	userID := re.Request.PathValue("id")

	var req updateUserRequest
	if err := re.BindBody(&req); err != nil {
		return re.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request data"})
	}

	userResp, err := ur.service.Update(userID, user.UpdateParams{
		Name:            req.Name,
		Username:        req.Username,
		Email:           req.Email,
		Password:        req.Password,
		Role:            req.Role,
		Verified:        req.Verified,
		EmailVisibility: req.EmailVisibility,
	})
	if err != nil {
		return ur.handleServiceError(re, err)
	}

	return re.JSON(http.StatusOK, map[string]any{"user": userResp})
}

func (ur *UserRoutes) adminExists(re *core.RequestEvent) error {
	exists, err := ur.service.AdminExists()
	if err != nil {
		log.Printf("check admin exists: %v", err)
		return re.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to check admin users"})
	}

	return re.JSON(http.StatusOK, map[string]bool{"adminExists": exists})
}

type adminSetupRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (ur *UserRoutes) setupAdmin(re *core.RequestEvent) error {
	var req adminSetupRequest
	if err := re.BindBody(&req); err != nil {
		return re.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request data"})
	}

	err := ur.service.SetupInitialAdmin(user.AdminSetupParams{
		Name:     req.Name,
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return ur.handleServiceError(re, err)
	}

	log.Printf("Initial admin user created: %s (%s)", req.Name, req.Email)
	return re.JSON(http.StatusCreated, map[string]string{"message": "Admin account created successfully"})
}

func (ur *UserRoutes) handleServiceError(re *core.RequestEvent, err error) error {
	var validationErr user.ValidationError
	if errors.As(err, &validationErr) {
		return re.JSON(http.StatusBadRequest, map[string]string{"error": validationErr.Message})
	}

	var notFoundErr user.NotFoundError
	if errors.As(err, &notFoundErr) {
		return re.JSON(http.StatusNotFound, map[string]string{"error": notFoundErr.Message})
	}

	if errors.Is(err, user.ErrAdminAlreadyExists) {
		return re.JSON(http.StatusBadRequest, map[string]string{"error": "Admin account already exists"})
	}

	log.Printf("user service error: %v", err)
	return re.JSON(http.StatusInternalServerError, map[string]string{"error": "internal server error"})
}
