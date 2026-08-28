package config

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"time"
)

type Config struct {
	AppEnv  string
	AppPort string
	AppURL  string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	RedisAddr     string
	RedisPassword string
	RedisDB       int

	JWTAccessSecret  string
	JWTRefreshSecret string
	JWTAccessTTL     time.Duration
	JWTRefreshTTL    time.Duration

	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioUseSSL    bool

	S3Endpoint        string
	S3AccessKeyID     string
	S3SecretAccessKey string
	S3Bucket          string
	S3UseSSL          bool
}

func Load() *Config {
	accessTTL, _ := time.ParseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
	refreshTTL, _ := time.ParseDuration(getEnv("JWT_REFRESH_TTL", "720h"))

	appEnv := getEnv("APP_ENV", "development")

	minioEndpoint := getEnv("MINIO_ENDPOINT", "localhost:9000")
	minioAccessKey := getEnv("MINIO_ACCESS_KEY", "minioadmin")
	minioSecretKey := getEnv("MINIO_SECRET_KEY", "minioadmin")
	minioBucket := getEnv("MINIO_BUCKET", "stroycompare")
	minioUseSSL := getEnv("MINIO_USE_SSL", "false") == "true"

	cfg := &Config{
		AppEnv:  appEnv,
		AppPort: getEnv("APP_PORT", "8080"),
		AppURL:  getEnv("APP_URL", "http://localhost:8080"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "stroycompare"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       0,

		JWTAccessSecret:  os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		JWTAccessTTL:     accessTTL,
		JWTRefreshTTL:    refreshTTL,

		MinioEndpoint:  minioEndpoint,
		MinioAccessKey: minioAccessKey,
		MinioSecretKey: minioSecretKey,
		MinioBucket:    minioBucket,
		MinioUseSSL:    minioUseSSL,

		// Синхронизируем S3 поля с Minio настройками (или читаем отдельно через S3_*)
		S3Endpoint:        getEnv("S3_ENDPOINT", minioEndpoint),
		S3AccessKeyID:     getEnv("S3_ACCESS_KEY_ID", minioAccessKey),
		S3SecretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", minioSecretKey),
		S3Bucket:          getEnv("S3_BUCKET", minioBucket),
		S3UseSSL:          getEnv("S3_USE_SSL", "false") == "true" || minioUseSSL,
	}

	validateSecrets(cfg)

	return cfg
}

// validateSecrets гарантирует, что JWT-секреты заданы явно.
// В production отсутствие/слабость секрета — фатальная ошибка (fail-fast):
// лучше не запуститься, чем запуститься с предсказуемым секретом.
// В development при отсутствии секрета генерируем случайный на время
// жизни процесса и громко предупреждаем.
func validateSecrets(cfg *Config) {
	isWeak := func(s string) bool {
		return len(s) < 32
	}

	if cfg.AppEnv == "production" {
		if isWeak(cfg.JWTAccessSecret) {
			log.Fatal("JWT_ACCESS_SECRET is missing or shorter than 32 characters — refusing to start in production")
		}
		if isWeak(cfg.JWTRefreshSecret) {
			log.Fatal("JWT_REFRESH_SECRET is missing or shorter than 32 characters — refusing to start in production")
		}
		if cfg.JWTAccessSecret == cfg.JWTRefreshSecret {
			log.Fatal("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different")
		}
		return
	}

	if isWeak(cfg.JWTAccessSecret) {
		cfg.JWTAccessSecret = randomSecret()
		log.Println("WARNING: JWT_ACCESS_SECRET not set — using a random secret for this run only. Set it in .env for stable sessions.")
	}
	if isWeak(cfg.JWTRefreshSecret) {
		cfg.JWTRefreshSecret = randomSecret()
		log.Println("WARNING: JWT_REFRESH_SECRET not set — using a random secret for this run only. Set it in .env for stable sessions.")
	}
}

func randomSecret() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("failed to generate random secret: %v", err)
	}
	return hex.EncodeToString(b)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
