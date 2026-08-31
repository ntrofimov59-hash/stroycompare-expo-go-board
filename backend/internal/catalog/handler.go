package catalog

import (
	"strings"
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

// GET /api/v1/categories
func (h *Handler) GetCategories(c *gin.Context) {
	var categories []models.Category

	query := h.db.Where("is_active = ?", true).Order("sort_order ASC")

	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}

	if err := query.Find(&categories).Error; err != nil {
		response.Internal(c, "failed to fetch categories")
		return
	}

	response.OK(c, gin.H{
		"categories": categories,
	})
}

// GET /api/v1/regions?country=RU
func (h *Handler) GetRegions(c *gin.Context) {
	var regions []models.Region
	query := h.db.Where("is_active = ?", true).Order("sort_order ASC, name ASC")

	if country := c.Query("country"); country != "" {
		query = query.Where("country_code = ?", strings.ToUpper(country))
	}

	if err := query.Find(&regions).Error; err != nil {
		response.Internal(c, "failed to fetch regions")
		return
	}

	response.OK(c, gin.H{"regions": regions})
}

// GET /api/v1/products
func (h *Handler) GetProducts(c *gin.Context) {
	var products []models.Product

	query := h.db.Where("is_active = ?", true).Preload("Category")

	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Order("name ASC").Find(&products).Error; err != nil {
		response.Internal(c, "failed to fetch products")
		return
	}

	response.OK(c, gin.H{
		"products": products,
	})
}

// GET /api/v1/products/:id
func (h *Handler) GetProduct(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}

	var product models.Product
	if err := h.db.Preload("Category").Preload("Images").First(&product, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "product not found")
			return
		}
		response.Internal(c, "failed to fetch product")
		return
	}

	response.OK(c, product)
}

// GET /api/v1/products/:id/offers — сравнение цен + скидка по подписке
func (h *Handler) GetProductOffers(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid product id")
		return
	}

	var product models.Product
	if err := h.db.Preload("Category").First(&product, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "product not found")
			return
		}
		response.Internal(c, "failed to fetch product")
		return
	}

	var offers []models.Offer
	query := h.db.
		Where("product_id = ? AND is_active = ?", id, true).
		Preload("Supplier").
		Preload("Region")

	if regionID := c.Query("region_id"); regionID != "" {
		query = query.Where("region_id = ?", regionID)
	}

	sort := c.DefaultQuery("sort", "price_asc")
	switch sort {
	case "price_desc":
		query = query.Order("price DESC")
	default:
		query = query.Order("price ASC")
	}

	if err := query.Find(&offers).Error; err != nil {
		response.Internal(c, "failed to fetch offers")
		return
	}

	// --- Применение скидки по подписке ---
	userHasSub := false
	var discountPercent float64

	if userID, exists := c.Get("user_id"); exists {
		var sub models.UserSubscription
		err := h.db.
			Preload("Plan").
			Where("user_id = ? AND status = ? AND end_at > ?", userID, "active", time.Now()).
			First(&sub).Error
		if err == nil {
			userHasSub = true
			discountPercent = sub.Plan.DiscountPercent
		}
	}

	for i := range offers {
		if userHasSub && offers[i].SupportsDiscount && discountPercent > 0 {
			offers[i].FinalPrice = round2(offers[i].Price * (1 - discountPercent/100))
			offers[i].AppliedDiscountPercent = discountPercent
		} else {
			offers[i].FinalPrice = offers[i].Price
			offers[i].AppliedDiscountPercent = 0
		}
	}

	response.OK(c, gin.H{
		"product":               product,
		"offers":                offers,
		"user_has_subscription": userHasSub,
	})
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}
