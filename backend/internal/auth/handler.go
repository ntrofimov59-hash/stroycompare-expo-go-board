package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/models"
	"github.com/stroycompare/backend/pkg/response"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

type Handler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewHandler(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, cfg: cfg}
}

type registerRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Role      string `json:"role"` // buyer | supplier
}

type loginRequest struct {
	Login    string `json:"login" binding:"required"` // email или phone
	Password string `json:"password" binding:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
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

	if len(req.Password) < 8 {
		response.BadRequest(c, "password must be at least 8 characters")
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

	// Если supplier — создаём запись поставщика и trial-подписку
	if role == "supplier" {
		companyName := strings.TrimSpace(req.FirstName + " " + req.LastName)
		if companyName == "" {
			companyName = "Поставщик"
		}
		if req.Phone != "" {
			// можно использовать телефон как название временно
		}
		supplier := models.Supplier{
			UserID:      user.ID,
			CompanyName: companyName,
			Phone:       "", // или req.Phone если добавишь
		}
		if err := h.db.Create(&supplier).Error; err != nil {
			// логируем, но пользователя уже создали — не падаем
			log.Printf("failed to create supplier profile: %v", err)
		}

		// Создаём trial-подписку на 30 дней
		// Ищем план "trial" или "supplier-trial"
		var trialPlan models.SubscriptionPlan
		err := h.db.Where("slug = ? AND is_active = ?", "supplier-trial", true).First(&trialPlan).Error
		if err != nil {
			// если плана нет — создаём на лету (для MVP)
			trialPlan = models.SubscriptionPlan{
				Name:            "Trial поставщика",
				Slug:            "supplier-trial",
				Description:     "Бесплатный пробный период 30 дней",
				Price:           0,
				DurationDays:    30,
				DiscountPercent: 0,
				IsActive:        true,
				SortOrder:       0,
			}
			if createErr := h.db.Create(&trialPlan).Error; createErr != nil {
				log.Printf("failed to create trial plan: %v", createErr)
			}
		}
		if trialPlan.ID != uuid.Nil {
			now := time.Now()
			trialSub := models.UserSubscription{
				UserID:    user.ID,
				PlanID:    trialPlan.ID,
				Status:    "active",
				StartAt:   now,
				EndAt:     now.AddDate(0, 0, 30),
				AutoRenew: false,
				PaymentID: "trial_" + user.ID.String()[:8],
			}
			if err := h.db.Create(&trialSub).Error; err != nil {
				log.Printf("failed to create trial subscription: %v", err)
			}
		}
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

	refreshExpiresAt := time.Now().Add(h.cfg.JWTRefreshTTL)
	refreshClaims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"exp":     refreshExpiresAt.Unix(),
		"iat":     time.Now().Unix(),
		"type":    "refresh",
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refresh, err = refreshToken.SignedString([]byte(h.cfg.JWTRefreshSecret))
	if err != nil {
		return
	}

	record := models.RefreshToken{
		UserID:    user.ID,
		TokenHash: hashToken(refresh),
		ExpiresAt: refreshExpiresAt,
	}
	if dbErr := h.db.Create(&record).Error; dbErr != nil {
		err = dbErr
		return
	}

	return
}

// POST /api/v1/auth/refresh
func (h *Handler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "refresh_token is required")
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.cfg.JWTRefreshSecret), nil
	})
	if err != nil || !token.Valid {
		response.Unauthorized(c, "invalid or expired refresh token")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["type"] != "refresh" {
		response.Unauthorized(c, "invalid refresh token")
		return
	}

	tokenHash := hashToken(req.RefreshToken)
	var stored models.RefreshToken
	if err := h.db.Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now()).
		First(&stored).Error; err != nil {
		response.Unauthorized(c, "refresh token not recognized or revoked")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", stored.UserID).Error; err != nil {
		response.Unauthorized(c, "user not found")
		return
	}
	if !user.IsActive {
		response.Forbidden(c, "account is disabled")
		return
	}

	h.db.Delete(&stored)

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

// POST /api/v1/auth/logout
func (h *Handler) Logout(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "refresh_token is required")
		return
	}

	tokenHash := hashToken(req.RefreshToken)
	h.db.Where("token_hash = ?", tokenHash).Delete(&models.RefreshToken{})

	response.OK(c, gin.H{"success": true})
}

// POST /api/v1/users/me/logout-all
func (h *Handler) LogoutAll(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}
	uid, ok := userID.(uuid.UUID)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}

	h.db.Where("user_id = ?", uid).Delete(&models.RefreshToken{})
	response.OK(c, gin.H{"success": true})
}
