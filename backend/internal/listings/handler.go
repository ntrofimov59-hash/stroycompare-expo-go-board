package listings

import (
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

// GET /api/v1/listings
func (h *Handler) List(c *gin.Context) {
	var items []models.Listing

	query := h.db.Where("status = ?", "active").
		Preload("Region").
		Order("created_at DESC")

	if t := c.Query("type"); t != "" && t != "all" {
		query = query.Where("type = ?", t)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if regionID := c.Query("region_id"); regionID != "" {
		query = query.Where("region_id = ?", regionID)
	}

	if err := query.Limit(100).Find(&items).Error; err != nil {
		response.Internal(c, "failed to fetch listings")
		return
	}

	response.OK(c, gin.H{"listings": items})
}

// GET /api/v1/listings/:id
func (h *Handler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var item models.Listing
	if err := h.db.Preload("Region").Preload("User").First(&item, "id = ? AND status = ?", id, "active").Error; err != nil {
		response.NotFound(c, "listing not found")
		return
	}

	item.User.PasswordHash = ""
	response.OK(c, item)
}

type createRequest struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description"`
	Price        *float64 `json:"price"`
	Type         string   `json:"type"` // material | service | other
	RegionID     string   `json:"region_id"`
	ContactPhone string   `json:"contact_phone"`
}

// POST /api/v1/listings
func (h *Handler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid := userID.(uuid.UUID)

	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "title is required")
		return
	}

	typ := req.Type
	if typ == "" {
		typ = "material"
	}
	if typ != "material" && typ != "service" && typ != "other" {
		response.BadRequest(c, "type must be material, service or other")
		return
	}

	item := models.Listing{
		UserID:       uid,
		Title:        req.Title,
		Description:  req.Description,
		Price:        req.Price,
		Currency:     "RUB",
		Type:         typ,
		Status:       "active",
		ContactPhone: req.ContactPhone,
	}

	if req.RegionID != "" {
		rid, err := uuid.Parse(req.RegionID)
		if err != nil {
			response.BadRequest(c, "invalid region_id")
			return
		}
		item.RegionID = &rid
	}

	if err := h.db.Create(&item).Error; err != nil {
		response.Internal(c, "failed to create listing")
		return
	}

	h.db.Preload("Region").First(&item, item.ID)
	response.Created(c, item)
}

// GET /api/v1/listings/me
func (h *Handler) MyListings(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var items []models.Listing
	if err := h.db.Where("user_id = ?", userID).
		Preload("Region").
		Order("created_at DESC").
		Find(&items).Error; err != nil {
		response.Internal(c, "failed to fetch")
		return
	}

	response.OK(c, gin.H{"listings": items})
}

// DELETE /api/v1/listings/:id
func (h *Handler) Delete(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	res := h.db.Model(&models.Listing{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("status", "hidden")

	if res.RowsAffected == 0 {
		response.NotFound(c, "listing not found")
		return
	}
	response.OK(c, gin.H{"ok": true})
}
