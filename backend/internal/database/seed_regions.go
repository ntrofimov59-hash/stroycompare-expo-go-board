package database

import (
	"log"

	"github.com/google/uuid"
	"github.com/stroycompare/backend/internal/models"
	"gorm.io/gorm"
)

func SeedRegions(db *gorm.DB) error {
	log.Println("Seeding regions...")

	// ВАЖНО: Москва с ФИКСИРОВАННЫМ id, как уже в offers на VPS
	moscowID := uuid.MustParse("a0000001-0000-0000-0000-000000000001")

	type item struct {
		ID          uuid.UUID
		Name        string
		Slug        string
		CountryCode string
		SortOrder   int
	}

	list := []item{
		// --- Россия ---
		{moscowID, "Москва", "ru-moscow", "RU", 1},
		{uuid.Nil, "Санкт-Петербург", "ru-spb", "RU", 2},
		{uuid.Nil, "Новосибирск", "ru-novosibirsk", "RU", 3},
		{uuid.Nil, "Екатеринбург", "ru-ekaterinburg", "RU", 4},
		{uuid.Nil, "Казань", "ru-kazan", "RU", 5},
		{uuid.Nil, "Нижний Новгород", "ru-nizhny-novgorod", "RU", 6},
		{uuid.Nil, "Челябинск", "ru-chelyabinsk", "RU", 7},
		{uuid.Nil, "Самара", "ru-samara", "RU", 8},
		{uuid.Nil, "Омск", "ru-omsk", "RU", 9},
		{uuid.Nil, "Ростов-на-Дону", "ru-rostov", "RU", 10},
		{uuid.Nil, "Уфа", "ru-ufa", "RU", 11},
		{uuid.Nil, "Красноярск", "ru-krasnoyarsk", "RU", 12},
		{uuid.Nil, "Воронеж", "ru-voronezh", "RU", 13},
		{uuid.Nil, "Пермь", "ru-perm", "RU", 14},
		{uuid.Nil, "Волгоград", "ru-volgograd", "RU", 15},
		{uuid.Nil, "Краснодар", "ru-krasnodar", "RU", 16},
		{uuid.Nil, "Саратов", "ru-saratov", "RU", 17},
		{uuid.Nil, "Тюмень", "ru-tyumen", "RU", 18},
		{uuid.Nil, "Тольятти", "ru-tolyatti", "RU", 19},
		{uuid.Nil, "Ижевск", "ru-izhevsk", "RU", 20},
		{uuid.Nil, "Барнаул", "ru-barnaul", "RU", 21},
		{uuid.Nil, "Ульяновск", "ru-ulyanovsk", "RU", 22},
		{uuid.Nil, "Иркутск", "ru-irkutsk", "RU", 23},
		{uuid.Nil, "Хабаровск", "ru-khabarovsk", "RU", 24},
		{uuid.Nil, "Ярославль", "ru-yaroslavl", "RU", 25},
		{uuid.Nil, "Владивосток", "ru-vladivostok", "RU", 26},
		{uuid.Nil, "Махачкала", "ru-makhachkala", "RU", 27},
		{uuid.Nil, "Томск", "ru-tomsk", "RU", 28},
		{uuid.Nil, "Оренбург", "ru-orenburg", "RU", 29},
		{uuid.Nil, "Кемерово", "ru-kemerovo", "RU", 30},
		{uuid.Nil, "Новокузнецк", "ru-novokuznetsk", "RU", 31},
		{uuid.Nil, "Рязань", "ru-ryazan", "RU", 32},
		{uuid.Nil, "Астрахань", "ru-astrakhan", "RU", 33},
		{uuid.Nil, "Пенза", "ru-penza", "RU", 34},
		{uuid.Nil, "Липецк", "ru-lipetsk", "RU", 35},
		{uuid.Nil, "Киров", "ru-kirov", "RU", 36},
		{uuid.Nil, "Чебоксары", "ru-cheboksary", "RU", 37},
		{uuid.Nil, "Калуга", "ru-kaluga", "RU", 38},
		{uuid.Nil, "Тула", "ru-tula", "RU", 39},
		{uuid.Nil, "Сочи", "ru-sochi", "RU", 40},

		// --- Беларусь ---
		{uuid.Nil, "Минск", "by-minsk", "BY", 100},
		{uuid.Nil, "Гомель", "by-gomel", "BY", 101},
		{uuid.Nil, "Могилёв", "by-mogilev", "BY", 102},
		{uuid.Nil, "Витебск", "by-vitebsk", "BY", 103},
		{uuid.Nil, "Гродно", "by-grodno", "BY", 104},
		{uuid.Nil, "Брест", "by-brest", "BY", 105},

		// --- Казахстан ---
		{uuid.Nil, "Алматы", "kz-almaty", "KZ", 110},
		{uuid.Nil, "Астана", "kz-astana", "KZ", 111},
		{uuid.Nil, "Шымкент", "kz-shymkent", "KZ", 112},
		{uuid.Nil, "Караганда", "kz-karaganda", "KZ", 113},
		{uuid.Nil, "Актобе", "kz-aktobe", "KZ", 114},
		{uuid.Nil, "Тараз", "kz-taraz", "KZ", 115},
		{uuid.Nil, "Павлодар", "kz-pavlodar", "KZ", 116},
		{uuid.Nil, "Усть-Каменогорск", "kz-ust-kamenogorsk", "KZ", 117},

		// --- Армения ---
		{uuid.Nil, "Ереван", "am-yerevan", "AM", 120},
		{uuid.Nil, "Гюмри", "am-gyumri", "AM", 121},
		{uuid.Nil, "Ванадзор", "am-vanadzor", "AM", 122},

		// --- Кыргызстан ---
		{uuid.Nil, "Бишкек", "kg-bishkek", "KG", 130},
		{uuid.Nil, "Ош", "kg-osh", "KG", 131},
		{uuid.Nil, "Джалал-Абад", "kg-jalal-abad", "KG", 132},
	}

	for _, r := range list {
		var existing models.Region

		// ищем по slug ИЛИ по фиксированному id (Москва)
		q := db.Where("slug = ?", r.Slug)
		if r.ID != uuid.Nil {
			q = db.Where("id = ? OR slug = ?", r.ID, r.Slug)
		}

		err := q.First(&existing).Error
		if err == nil {
			// уже есть — только обновим название/страну, id не трогаем
			existing.Name = r.Name
			existing.Slug = r.Slug
			existing.CountryCode = r.CountryCode
			existing.SortOrder = r.SortOrder
			existing.IsActive = true
			_ = db.Save(&existing).Error
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}

		rec := models.Region{
			Name:        r.Name,
			Slug:        r.Slug,
			CountryCode: r.CountryCode,
			SortOrder:   r.SortOrder,
			IsActive:    true,
		}
		if r.ID != uuid.Nil {
			rec.ID = r.ID // сохраняем id Москвы для старых offers
		}

		if err := db.Create(&rec).Error; err != nil {
			return err
		}
	}

	log.Println("Regions seeded")
	return nil
}
