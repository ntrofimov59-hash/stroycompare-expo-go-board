package auth

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/models"
	"github.com/stroycompare/backend/pkg/response"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewHandler(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, cfg: cfg}
}

type registerRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Role      string `json:"role"` // buyer | supplier
}

type loginRequest struct {
	Login    string `json:"login" binding:"required"` // email или phone
	Password string `json:"password" binding:"required"`
}

type tokenResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int64       `json:"expires_in"`
	User         models.User `json:"user"`
}

// POST /api/v1/auth/register
func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	role := req.Role
	if role == "" {
		role = "buyer"
	}
	if role != "buyer" && role != "supplier" {
		response.BadRequest(c, "role must be buyer or supplier")
		return
	}

	// Проверяем, есть ли уже пользователь
	var existing models.User
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		response.Conflict(c, "email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, "failed to hash password")
		return
	}

	user := models.User{
		Email:        &req.Email,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         role,
		IsActive:     true,
	}
	if req.Phone != "" {
		user.Phone = &req.Phone
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Internal(c, "failed to create user")
		return
	}

	// Если supplier — создаём запись поставщика
	if role == "supplier" {
		supplier := models.Supplier{
			UserID:      user.ID,
			CompanyName: req.FirstName + " " + req.LastName,
		}
		_ = h.db.Create(&supplier).Error
	}

	access, refresh, expiresIn, err := h.generateTokens(user)
	if err != nil {
		response.Internal(c, "failed to generate tokens")
		return
	}

	user.PasswordHash = ""
	response.Created(c, tokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    expiresIn,
		User:         user,
	})
}

// POST /api/v1/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	var user models.User
	err := h.db.Where("email = ? OR phone = ?", req.Login, req.Login).First(&user).Error
	if err != nil {
		response.Unauthorized(c, "invalid login or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		response.Unauthorized(c, "invalid login or password")
		return
	}

	if !user.IsActive {
		response.Forbidden(c, "account is disabled")
		return
	}

	access, refresh, expiresIn, err := h.generateTokens(user)
	if err != nil {
		response.Internal(c, "failed to generate tokens")
		return
	}

	user.PasswordHash = ""
	response.OK(c, tokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    expiresIn,
		User:         user,
	})
}

// GET /api/v1/users/me
func (h *Handler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}

	var user models.User
	if err := h.db.Preload("Supplier").First(&user, "id = ?", userID).Error; err != nil {
		response.NotFound(c, "user not found")
		return
	}

	user.PasswordHash = ""
	response.OK(c, user)
}

func (h *Handler) generateTokens(user models.User) (access, refresh string, expiresIn int64, err error) {
	expiresIn = int64(h.cfg.JWTAccessTTL.Seconds())

	accessClaims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"role":    user.Role,
		"exp":     time.Now().Add(h.cfg.JWTAccessTTL).Unix(),
		"iat":     time.Now().Unix(),
		"type":    "access",
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	access, err = accessToken.SignedString([]byte(h.cfg.JWTAccessSecret))
	if err != nil {
		return
	}

	refreshClaims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"exp":     time.Now().Add(h.cfg.JWTRefreshTTL).Unix(),
		"iat":     time.Now().Unix(),
		"type":    "refresh",
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refresh, err = refreshToken.SignedString([]byte(h.cfg.JWTRefreshSecret))
	return
}
