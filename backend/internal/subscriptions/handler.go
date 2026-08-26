package subscriptions

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

// GET /api/v1/subscriptions/plans
func (h *Handler) GetPlans(c *gin.Context) {
	var plans []models.SubscriptionPlan
	if err := h.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&plans).Error; err != nil {
		response.Internal(c, "failed to fetch plans")
		return
	}
	response.OK(c, gin.H{"plans": plans})
}

// GET /api/v1/subscriptions/me
func (h *Handler) GetMySubscription(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var sub models.UserSubscription
	err := h.db.
		Preload("Plan").
		Where("user_id = ? AND status = ? AND end_at > ?", userID, "active", time.Now()).
		Order("end_at DESC").
		First(&sub).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			response.OK(c, gin.H{
				"has_subscription": false,
				"subscription":     nil,
			})
			return
		}
		response.Internal(c, "failed to fetch subscription")
		return
	}

	response.OK(c, gin.H{
		"has_subscription": true,
		"subscription":     sub,
	})
}

// POST /api/v1/subscriptions/purchase  (тестовая активация без оплаты)
func (h *Handler) Purchase(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		PlanID string `json:"plan_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "plan_id is required")
		return
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		response.BadRequest(c, "invalid plan_id")
		return
	}

	var plan models.SubscriptionPlan
	if err := h.db.Where("id = ? AND is_active = ?", planID, true).First(&plan).Error; err != nil {
		response.NotFound(c, "plan not found")
		return
	}

	// Деактивируем старые активные подписки
	h.db.Model(&models.UserSubscription{}).
		Where("user_id = ? AND status = ?", userID, "active").
		Update("status", "cancelled")

	now := time.Now()
	sub := models.UserSubscription{
		UserID:    userID.(uuid.UUID),
		PlanID:    plan.ID,
		Status:    "active",
		StartAt:   now,
		EndAt:     now.AddDate(0, 0, plan.DurationDays),
		AutoRenew: false,
		PaymentID: "test_" + uuid.New().String()[:8],
	}

	if err := h.db.Create(&sub).Error; err != nil {
		response.Internal(c, "failed to create subscription")
		return
	}

	h.db.Preload("Plan").First(&sub, sub.ID)

	response.Created(c, gin.H{
		"message":      "subscription activated (test mode)",
		"subscription": sub,
	})
}