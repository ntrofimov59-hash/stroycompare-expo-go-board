package database

import (
	"log"

	"github.com/stroycompare/backend/internal/models"
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	log.Println("Running AutoMigrate...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Supplier{},
		&models.Category{},
		&models.Product{},
		&models.ProductImage{},
		&models.Region{},
		&models.Offer{},
		&models.Listing{},
		&models.SubscriptionPlan{},
		&models.UserSubscription{},
		&models.RefreshToken{},
	)
	if err != nil {
		return err
	}

	log.Println("AutoMigrate completed")
	return nil
}
