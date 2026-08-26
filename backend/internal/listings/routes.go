package listings

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db)

	// Публичная лента
	rg.GET("/listings", h.List)
	rg.GET("/listings/:id", h.Get)

	// Свои объявления
	auth := rg.Group("/listings")
	auth.Use(middleware.Auth(cfg))
	{
		auth.GET("/me", h.MyListings)
		auth.POST("", h.Create)
		auth.DELETE("/:id", h.Delete)
	}
}
