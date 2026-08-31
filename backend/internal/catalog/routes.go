package catalog

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db)

	rg.GET("/regions", h.GetRegions)
	rg.GET("/categories", h.GetCategories)
	rg.GET("/products", h.GetProducts)
	rg.GET("/products/:id", h.GetProduct)

	// offers — с опциональной авторизацией (чтобы применять скидку)
	rg.GET("/products/:id/offers", middleware.OptionalAuth(cfg), h.GetProductOffers)
}
