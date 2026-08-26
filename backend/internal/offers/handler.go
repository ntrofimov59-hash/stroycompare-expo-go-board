package offers

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

func (h *Handler) getSupplier(c *gin.Context) (*models.Supplier, bool) {
	userID, _ := c.Get("user_id")
	uid := userID.(uuid.UUID)

	var sub int64
	h.db.Model(&models.UserSubscription{}).
		Where("user_id = ? AND status = ? AND end_at > ?", uid, "active", time.Now()).
		Count(&sub)
	if sub == 0 {
		response.Forbidden(c, "active subscription required")
		return nil, false
	}

	var supplier models.Supplier
	if err := h.db.Where("user_id = ?", uid).First(&supplier).Error; err != nil {
		response.Forbidden(c, "supplier profile required")
		return nil, false
	}
	return &supplier, true
}

// GET /api/v1/offers/me
func (h *Handler) MyOffers(c *gin.Context) {
	supplier, ok := h.getSupplier(c)
	if !ok {
		return
	}

	var list []models.Offer
	if err := h.db.Where("supplier_id = ?", supplier.ID).
		Preload("Product").
		Preload("Region").
		Order("updated_at DESC").
		Find(&list).Error; err != nil {
		response.Internal(c, "failed to fetch offers")
		return
	}
	response.OK(c, gin.H{"offers": list})
}

type offerRequest struct {
	ProductID        string   `json:"product_id" binding:"required"`
	RegionID         string   `json:"region_id" binding:"required"`
	Price            float64  `json:"price" binding:"required"`
	MinOrderQty      float64  `json:"min_order_qty"`
	StockQty         *float64 `json:"stock_qty"`
	DeliveryDays     *int     `json:"delivery_days"`
	SupportsDiscount *bool    `json:"supports_discount"`
}

// POST /api/v1/offers
func (h *Handler) Create(c *gin.Context) {
	supplier, ok := h.getSupplier(c)
	if !ok {
		return
	}

	var req offerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body", err.Error())
		return
	}

	productID, err1 := uuid.Parse(req.ProductID)
	regionID, err2 := uuid.Parse(req.RegionID)
	if err1 != nil || err2 != nil {
		response.BadRequest(c, "invalid product_id or region_id")
		return
	}

	supports := true
	if req.SupportsDiscount != nil {
		supports = *req.SupportsDiscount
	}
	minQty := req.MinOrderQty
	if minQty <= 0 {
		minQty = 1
	}

	offer := models.Offer{
		ProductID:        productID,
		SupplierID:       supplier.ID,
		RegionID:         regionID,
		Price:            req.Price,
		Currency:         "RUB",
		MinOrderQty:      minQty,
		StockQty:         req.StockQty,
		DeliveryDays:     req.DeliveryDays,
		SupportsDiscount: supports,
		IsActive:         true,
	}

	if err := h.db.Create(&offer).Error; err != nil {
		response.Conflict(c, "offer already exists for this product and region")
		return
	}

	h.db.Preload("Product").Preload("Region").First(&offer, offer.ID)
	response.Created(c, offer)
}

// PUT /api/v1/offers/:id
func (h *Handler) Update(c *gin.Context) {
	supplier, ok := h.getSupplier(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var offer models.Offer
	if err := h.db.Where("id = ? AND supplier_id = ?", id, supplier.ID).First(&offer).Error; err != nil {
		response.NotFound(c, "offer not found")
		return
	}

	var req struct {
		Price            *float64 `json:"price"`
		MinOrderQty      *float64 `json:"min_order_qty"`
		StockQty         *float64 `json:"stock_qty"`
		DeliveryDays     *int     `json:"delivery_days"`
		SupportsDiscount *bool    `json:"supports_discount"`
		IsActive         *bool    `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid body")
		return
	}

	if req.Price != nil {
		offer.Price = *req.Price
	}
	if req.MinOrderQty != nil {
		offer.MinOrderQty = *req.MinOrderQty
	}
	if req.StockQty != nil {
		offer.StockQty = req.StockQty
	}
	if req.DeliveryDays != nil {
		offer.DeliveryDays = req.DeliveryDays
	}
	if req.SupportsDiscount != nil {
		offer.SupportsDiscount = *req.SupportsDiscount
	}
	if req.IsActive != nil {
		offer.IsActive = *req.IsActive
	}

	if err := h.db.Save(&offer).Error; err != nil {
		response.Internal(c, "failed to update")
		return
	}
	response.OK(c, offer)
}

// DELETE /api/v1/offers/:id  (деактивация)
func (h *Handler) Delete(c *gin.Context) {
	supplier, ok := h.getSupplier(c)
	if !ok {
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	res := h.db.Model(&models.Offer{}).
		Where("id = ? AND supplier_id = ?", id, supplier.ID).
		Update("is_active", false)

	if res.RowsAffected == 0 {
		response.NotFound(c, "offer not found")
		return
	}
	response.OK(c, gin.H{"ok": true})
}
