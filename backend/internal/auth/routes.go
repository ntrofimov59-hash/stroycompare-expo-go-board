package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db, cfg)

	auth := rg.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}

	// Защищённые маршруты
	users := rg.Group("/users")
	users.Use(middleware.Auth(cfg))
	{
		users.GET("/me", h.Me)
	}
}