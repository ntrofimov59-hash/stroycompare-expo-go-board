package auth

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, rdb *redis.Client, cfg *config.Config) {
	h := NewHandler(db, cfg)

	auth := rg.Group("/auth")
	// Защищаем эндпоинты авторизации от брутфорса: максимум 10 запросов в минуту с одного IP
	auth.Use(middleware.RateLimit(rdb, 10, time.Minute))
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/refresh", h.Refresh)
		auth.POST("/logout", h.Logout)
	}

	// Защищённые маршруты
	users := rg.Group("/users")
	users.Use(middleware.Auth(cfg))
	{
		users.GET("/me", h.Me)
		users.POST("/me/logout-all", h.LogoutAll)
	}
}
