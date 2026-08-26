package subscriptions

import (
	"github.com/gin-gonic/gin"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/middleware"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	h := NewHandler(db)

	// Публичный список тарифов
	rg.GET("/subscriptions/plans", h.GetPlans)

	// Защищённые
	sub := rg.Group("/subscriptions")
	sub.Use(middleware.Auth(cfg))
	{
		sub.GET("/me", h.GetMySubscription)
		sub.POST("/purchase", h.Purchase)
	}
}