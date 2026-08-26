package offers

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db)

	g := rg.Group("/offers")
	g.Use(middleware.Auth(cfg))
	g.Use(middleware.RequireRole("supplier", "admin"))
	{
		g.GET("/me", h.MyOffers)
		g.POST("", h.Create)
		g.PUT("/:id", h.Update)
		g.DELETE("/:id", h.Delete)
	}
}
