package auth

import (
	"testing"
)

func TestHashToken(t *testing.T) {
	token := "some-super-secret-refresh-token-string"

	// Проверяем, что хэширование работает детерминированно (один и тот же вход дает одинаковый выход)
	hash1 := hashToken(token)
	hash2 := hashToken(token)

	if hash1 != hash2 {
		t.Errorf("expected hashToken to be deterministic: got %s and %s", hash1, hash2)
	}

	// Проверяем, что хэш имеет правильную длину для SHA-256 в hex (64 символа)
	if len(hash1) != 64 {
		t.Errorf("expected sha256 hex string to be 64 characters long, got %d", len(hash1))
	}

	// Проверяем, что разные токены дают разные хэши
	otherHash := hashToken("another-token")
	if hash1 == otherHash {
		t.Error("expected different tokens to produce different hashes")
	}
}
