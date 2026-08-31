package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/stroycompare/backend/internal/auth"
	"github.com/stroycompare/backend/internal/catalog"
	"github.com/stroycompare/backend/internal/config"
	"github.com/stroycompare/backend/internal/database"
	"github.com/stroycompare/backend/internal/listings"
	"github.com/stroycompare/backend/internal/middleware"
	"github.com/stroycompare/backend/internal/offers"
	"github.com/stroycompare/backend/internal/subscriptions"
	"github.com/stroycompare/backend/internal/users"
)

func main() {
	// Загружаем .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	// Подключаем PostgreSQL
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("failed to auto-migrate: %v", err)
	}

	// сид регионов — можно всегда, он idempotent (не дублирует)
	if err := database.SeedRegions(db); err != nil {
		log.Printf("seed regions warning: %v", err)
	}

	if cfg.AppEnv == "development" {
		if err := database.Seed(db); err != nil {
			log.Printf("seed warning: %v", err)
		}
	}

	// Подключаем Redis
	rdb, err := database.ConnectRedis(cfg)
	if err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	// Режим Gin
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORS(cfg))
	r.Use(middleware.RequestID())

	// Health-check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "stroycompare-api",
		})
	})

	// API v1
	v1 := r.Group("/api/v1")
	{
		auth.RegisterRoutes(v1, db, rdb, cfg)
		catalog.RegisterRoutes(v1, db, cfg)
		subscriptions.RegisterRoutes(v1, db, cfg)
		listings.RegisterRoutes(v1, db, cfg)
		offers.RegisterRoutes(v1, db, cfg)
		users.RegisterRoutes(v1, db, cfg)
	}

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8090"
	}

	log.Printf("Starting server on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
