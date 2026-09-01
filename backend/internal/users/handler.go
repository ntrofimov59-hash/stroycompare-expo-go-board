package users

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stroycompare/backend/internal/models"
	"github.com/stroycompare/backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

type becomeSupplierRequest struct {
	CompanyName string `json:"company_name" binding:"required"`
	INN         string `json:"inn"`
}

// POST /api/v1/users/me/become-supplier
func (h *Handler) BecomeSupplier(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid := userID.(uuid.UUID)

	var user models.User
	if err := h.db.Preload("Supplier").First(&user, "id = ?", uid).Error; err != nil {
		response.NotFound(c, "user not found")
		return
	}

	if user.Supplier != nil && user.Supplier.ID != uuid.Nil {
		response.Conflict(c, "already a supplier")
		return
	}

	// Нужна активная подписка (не trial-only ограничение — любая active)
	if !h.hasActiveSubscription(uid) {
		response.Forbidden(c, "premium subscription required to become supplier")
		return
	}

	var req becomeSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "company_name is required")
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&user).Update("role", "supplier").Error; err != nil {
			return err
		}
		s := models.Supplier{
			UserID:      uid,
			CompanyName: req.CompanyName,
			INN:         req.INN,
		}
		return tx.Create(&s).Error
	})
	if err != nil {
		response.Internal(c, "failed to become supplier")
		return
	}

	h.db.Preload("Supplier").First(&user, "id = ?", uid)
	user.PasswordHash = ""
	response.OK(c, user)
}

// DELETE /api/v1/users/me
func (h *Handler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}
	uid := userID.(uuid.UUID)

	if err := h.db.Delete(&models.User{}, "id = ?", uid).Error; err != nil {
		response.Internal(c, "failed to delete account")
		return
	}

	response.OK(c, gin.H{"success": true, "message": "account deleted successfully"})
}

func (h *Handler) hasActiveSubscription(userID uuid.UUID) bool {
	var n int64
	h.db.Model(&models.UserSubscription{}).
		Where("user_id = ? AND status = ? AND end_at > ?", userID, "active", time.Now()).
		Count(&n)
	return n > 0
}
