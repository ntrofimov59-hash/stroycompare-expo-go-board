package database

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/stroycompare/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	log.Println("Seeding database...")

	// 1. Регионы
	regions := []models.Region{
		{Name: "Москва", Slug: "moscow"},
		{Name: "Московская область", Slug: "moscow-oblast"},
		{Name: "Санкт-Петербург", Slug: "spb"},
		{Name: "Ленинградская область", Slug: "lo"},
	}
	for i := range regions {
		var existing models.Region
		if err := db.Where("slug = ?", regions[i].Slug).First(&existing).Error; err == gorm.ErrRecordNotFound {
			if err := db.Create(&regions[i]).Error; err != nil {
				return err
			}
		}
	}

	// 2. Планы подписки
	plans := []models.SubscriptionPlan{
		{
			Name:            "Trial поставщика",
			Slug:            "supplier-trial",
			Description:     "Бесплатный пробный период 30 дней для поставщиков",
			Price:           0,
			DurationDays:    30,
			DiscountPercent: 0,
			IsActive:        true,
			SortOrder:       0,
		},
		{
			Name:            "Premium Buyer",
			Slug:            "premium-buyer",
			Description:     "Скидка 5% на все предложения, поддерживающие скидку",
			Price:           990,
			DurationDays:    30,
			DiscountPercent: 5,
			IsActive:        true,
			SortOrder:       1,
		},
		{
			Name:            "Premium Supplier",
			Slug:            "premium-supplier",
			Description:     "Полный доступ к кабинету поставщика",
			Price:           2990,
			DurationDays:    30,
			DiscountPercent: 0,
			IsActive:        true,
			SortOrder:       2,
		},
	}
	for i := range plans {
		var existing models.SubscriptionPlan
		if err := db.Where("slug = ?", plans[i].Slug).First(&existing).Error; err == gorm.ErrRecordNotFound {
			if err := db.Create(&plans[i]).Error; err != nil {
				return err
			}
		}
	}

	// 3. Категории
	categories := []struct {
		Name, Slug, Type string
		Sort             int
	}{
		{"Цемент и бетон", "cement", "material", 1},
		{"Кирпич и блоки", "brick", "material", 2},
		{"Пиломатериалы", "timber", "material", 3},
		{"Металлопрокат", "metal", "material", 4},
		{"Изоляция", "insulation", "material", 5},
		{"Кровельные материалы", "roofing", "material", 6},
		{"Сухие смеси", "dry-mix", "material", 7},
		{"Строительные услуги", "services", "service", 10},
	}

	categoryMap := make(map[string]uuid.UUID)
	for _, c := range categories {
		var existing models.Category
		if err := db.Where("slug = ?", c.Slug).First(&existing).Error; err == gorm.ErrRecordNotFound {
			cat := models.Category{
				Name:      c.Name,
				Slug:      c.Slug,
				Type:      c.Type,
				SortOrder: c.Sort,
				IsActive:  true,
			}
			if err := db.Create(&cat).Error; err != nil {
				return err
			}
			categoryMap[c.Slug] = cat.ID
		} else {
			categoryMap[c.Slug] = existing.ID
		}
	}

	// 4. Товары
	products := []struct {
		CategorySlug, Name, Slug, Unit, Type string
	}{
		{"cement", "Цемент М500 50 кг", "cement-m500-50kg", "мешок", "material"},
		{"cement", "Цемент М400 50 кг", "cement-m400-50kg", "мешок", "material"},
		{"cement", "Бетон М300", "concrete-m300", "м³", "material"},
		{"brick", "Кирпич керамический одинарный", "brick-ceramic-single", "шт", "material"},
		{"brick", "Газоблок D500 600x300x200", "gasblock-d500", "шт", "material"},
		{"timber", "Доска обрезная 50x150x6000", "board-50x150", "м³", "material"},
		{"timber", "Брус 100x100x6000", "timber-100x100", "м³", "material"},
		{"metal", "Арматура А500С Ø12", "rebar-a500-12", "т", "material"},
		{"metal", "Профнастил С8", "proflist-c8", "м²", "material"},
		{"insulation", "Минеральная вата 50 мм", "minwool-50", "м²", "material"},
		{"insulation", "Пенопласт ПСБ-С 25 50 мм", "foam-psb25-50", "м²", "material"},
		{"roofing", "Металлочерепица Монтеррей", "metal-tile-monterrey", "м²", "material"},
		{"dry-mix", "Штукатурка гипсовая 30 кг", "plaster-gypsum-30", "мешок", "material"},
		{"dry-mix", "Клей для плитки 25 кг", "tile-adhesive-25", "мешок", "material"},
		{"services", "Кладка кирпича", "bricklaying", "м²", "service"},
		{"services", "Штукатурка стен", "wall-plastering", "м²", "service"},
		{"services", "Стяжка пола", "floor-screed", "м²", "service"},
	}

	productMap := make(map[string]uuid.UUID)
	for _, p := range products {
		var existing models.Product
		if err := db.Where("slug = ?", p.Slug).First(&existing).Error; err == gorm.ErrRecordNotFound {
			prod := models.Product{
				CategoryID: categoryMap[p.CategorySlug],
				Name:       p.Name,
				Slug:       p.Slug,
				Unit:       p.Unit,
				Type:       p.Type,
				IsActive:   true,
			}
			if err := db.Create(&prod).Error; err != nil {
				return err
			}
			productMap[p.Slug] = prod.ID
		} else {
			productMap[p.Slug] = existing.ID
		}
	}

	// 5. Тестовые пользователи + поставщики
	type testUser struct {
		Email, Password, FirstName, Role, Company string
	}
	users := []testUser{
		{"buyer@test.ru", "password123", "Иван", "buyer", ""},
		{"supplier1@test.ru", "password123", "Алексей", "supplier", "СтройБаза №1"},
		{"supplier2@test.ru", "password123", "Дмитрий", "supplier", "МегаСтрой"},
		{"supplier3@test.ru", "password123", "Сергей", "supplier", "ЦементТорг"},
	}

	var moscowRegion models.Region
	db.Where("slug = ?", "moscow").First(&moscowRegion)

	for _, u := range users {
		var existing models.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err == nil {
			continue
		}

		hash, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		email := u.Email
		user := models.User{
			Email:        &email,
			PasswordHash: string(hash),
			FirstName:    u.FirstName,
			LastName:     "Тестов",
			Role:         u.Role,
			IsActive:     true,
		}
		if err := db.Create(&user).Error; err != nil {
			return err
		}

		if u.Role == "supplier" {
			supplier := models.Supplier{
				UserID:      user.ID,
				CompanyName: u.Company,
				IsVerified:  true,
				Rating:      4.5,
			}
			if err := db.Create(&supplier).Error; err != nil {
				return err
			}

			// Trial подписка
			var trial models.SubscriptionPlan
			db.Where("slug = ?", "supplier-trial").First(&trial)
			if trial.ID != uuid.Nil {
				sub := models.UserSubscription{
					UserID:    user.ID,
					PlanID:    trial.ID,
					Status:    "active",
					StartAt:   time.Now(),
					EndAt:     time.Now().AddDate(0, 0, 30),
					PaymentID: "seed_trial",
				}
				db.Create(&sub)
			}

			// Несколько offers
			prices := map[string]float64{
				"cement-m500-50kg":     380,
				"cement-m400-50kg":     340,
				"brick-ceramic-single": 18,
				"gasblock-d500":        95,
				"rebar-a500-12":        52000,
				"minwool-50":           210,
			}
			for slug, price := range prices {
				if pid, ok := productMap[slug]; ok {
					// немного варьируем цены
					p := price
					if u.Company == "МегаСтрой" {
						p *= 0.97
					}
					if u.Company == "ЦементТорг" {
						p *= 1.04
					}
					offer := models.Offer{
						ProductID:        pid,
						SupplierID:       supplier.ID,
						RegionID:         moscowRegion.ID,
						Price:            p,
						Currency:         "RUB",
						MinOrderQty:      1,
						SupportsDiscount: true,
						IsActive:         true,
					}
					db.Create(&offer)
				}
			}
		}
	}

	log.Println("Seeding completed")
	return nil
}
