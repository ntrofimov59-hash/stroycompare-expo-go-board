package users

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db)

	u := rg.Group("/users")
	u.Use(middleware.Auth(cfg))
	{
		u.POST("/me/become-supplier", h.BecomeSupplier)
		u.DELETE("/me", h.DeleteAccount)
	}
}
