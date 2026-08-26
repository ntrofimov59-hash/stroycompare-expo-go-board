package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Базовая модель с UUID
type Base struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type User struct {
	Base
	Email        *string `gorm:"uniqueIndex;size:255" json:"email,omitempty"`
	Phone        *string `gorm:"uniqueIndex;size:20" json:"phone,omitempty"`
	PasswordHash string  `gorm:"not null" json:"-"`
	FirstName    string  `gorm:"size:100" json:"first_name"`
	LastName     string  `gorm:"size:100" json:"last_name"`
	Role         string  `gorm:"size:20;not null;default:buyer" json:"role"` // buyer | supplier | admin
	IsActive     bool    `gorm:"default:true" json:"is_active"`

	Supplier     *Supplier         `json:"supplier,omitempty"`
	Subscription *UserSubscription `json:"subscription,omitempty"`
	Listings     []Listing         `json:"listings,omitempty"`
}

type Supplier struct {
	Base
	UserID       uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	CompanyName  string    `gorm:"size:255;not null" json:"company_name"`
	INN          string    `gorm:"size:12" json:"inn,omitempty"`
	Description  string    `gorm:"type:text" json:"description,omitempty"`
	Phone        string    `gorm:"size:32" json:"phone,omitempty"`
	LogoURL      string    `gorm:"column:logo_url;size:500" json:"logo_url,omitempty"`
	Rating       float64   `gorm:"type:decimal(3,2);default:0" json:"rating"`
	ReviewsCount int       `gorm:"default:0" json:"reviews_count"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`

	User   User    `gorm:"foreignKey:UserID" json:"-"`
	Offers []Offer `json:"offers,omitempty"`
}

type Category struct {
	Base
	ParentID  *uuid.UUID `gorm:"type:uuid" json:"parent_id,omitempty"`
	Name      string     `gorm:"size:150;not null" json:"name"`
	Slug      string     `gorm:"size:150;uniqueIndex;not null" json:"slug"`
	Type      string     `gorm:"size:20;not null" json:"type"` // material | service
	SortOrder int        `gorm:"default:0" json:"sort_order"`
	IsActive  bool       `gorm:"default:true" json:"is_active"`

	Parent   *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Products []Product  `json:"products,omitempty"`
}

type Product struct {
	Base
	CategoryID  uuid.UUID `gorm:"type:uuid;not null;index" json:"category_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Slug        string    `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description string    `gorm:"type:text" json:"description,omitempty"`
	Unit        string    `gorm:"size:50;not null" json:"unit"`
	Type        string    `gorm:"size:20;not null;index" json:"type"` // material | service
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	ImageURL    string    `gorm:"column:image_url;size:500" json:"image_url,omitempty"`

	Category Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Images   []ProductImage `json:"images,omitempty"`
	Offers   []Offer        `json:"offers,omitempty"`
}

type ProductImage struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProductID uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	URL       string    `gorm:"size:500;not null" json:"url"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	IsMain    bool      `gorm:"default:false" json:"is_main"`
}

type Region struct {
	ID       uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name     string     `gorm:"size:100;not null" json:"name"`
	Slug     string     `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ParentID *uuid.UUID `gorm:"type:uuid" json:"parent_id,omitempty"`
}

// Listing — модель для доски объявлений/предложений
type Listing struct {
	Base
	UserID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	RegionID     *uuid.UUID `gorm:"type:uuid;index" json:"region_id,omitempty"`
	Title        string     `gorm:"size:255;not null" json:"title"`
	Description  string     `gorm:"type:text" json:"description,omitempty"`
	Price        *float64   `gorm:"type:decimal(12,2)" json:"price,omitempty"`
	Currency     string     `gorm:"size:3;default:RUB" json:"currency"`
	Type         string     `gorm:"size:20;not null;default:material" json:"type"` // material | service | other
	Status       string     `gorm:"size:20;not null;default:active" json:"status"` // active | hidden | deleted
	ContactPhone string     `gorm:"size:20" json:"contact_phone,omitempty"`
	ImageURL     string     `gorm:"column:image_url;size:500" json:"image_url,omitempty"`

	User   User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Region *Region `gorm:"foreignKey:RegionID" json:"region,omitempty"`
}

type Offer struct {
	Base
	ProductID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"product_id"`
	SupplierID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"supplier_id"`
	RegionID         uuid.UUID  `gorm:"type:uuid;not null;index" json:"region_id"`
	Price            float64    `gorm:"type:decimal(12,2);not null" json:"price"`
	Currency         string     `gorm:"size:3;default:RUB" json:"currency"`
	MinOrderQty      float64    `gorm:"type:decimal(10,2);default:1" json:"min_order_qty"`
	StockQty         *float64   `gorm:"type:decimal(12,2)" json:"stock_qty,omitempty"`
	DeliveryDays     *int       `json:"delivery_days,omitempty"`
	SupportsDiscount bool       `gorm:"default:true" json:"supports_discount"`
	IsActive         bool       `gorm:"default:true" json:"is_active"`
	ValidUntil       *time.Time `json:"valid_until,omitempty"`

	Product  Product  `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Supplier Supplier `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Region   Region   `gorm:"foreignKey:RegionID" json:"region,omitempty"`

	// Виртуальные поля (не хранятся в БД)
	FinalPrice             float64 `gorm:"-" json:"final_price"`
	AppliedDiscountPercent float64 `gorm:"-" json:"discount_percent"`
}

type SubscriptionPlan struct {
	Base
	Name            string  `gorm:"size:100;not null" json:"name"`
	Slug            string  `gorm:"size:50;uniqueIndex;not null" json:"slug"`
	Description     string  `gorm:"type:text" json:"description,omitempty"`
	Price           float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	DurationDays    int     `gorm:"not null" json:"duration_days"`
	DiscountPercent float64 `gorm:"type:decimal(5,2);not null" json:"discount_percent"`
	IsActive        bool    `gorm:"default:true" json:"is_active"`
	SortOrder       int     `gorm:"default:0" json:"sort_order"`
}

type UserSubscription struct {
	Base
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	PlanID    uuid.UUID `gorm:"type:uuid;not null" json:"plan_id"`
	Status    string    `gorm:"size:20;not null;default:active" json:"status"` // active | expired | cancelled
	StartAt   time.Time `gorm:"not null" json:"start_at"`
	EndAt     time.Time `gorm:"not null;index" json:"end_at"`
	AutoRenew bool      `gorm:"default:false" json:"auto_renew"`
	PaymentID string    `gorm:"size:100" json:"payment_id,omitempty"`

	User User             `gorm:"foreignKey:UserID" json:"-"`
	Plan SubscriptionPlan `gorm:"foreignKey:PlanID" json:"plan,omitempty"`
}

type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	TokenHash string    `gorm:"size:255;uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
