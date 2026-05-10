package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/video-site/backend/internal/catalog"
)

const (
	sessionCookie = "vs_admin"
	sessionTTL    = 24 * time.Hour
)

type Authenticator struct {
	Username string
	Password string
	Catalog  *catalog.Catalog
}

func (a *Authenticator) Login(w http.ResponseWriter, r *http.Request, user, pass string) (bool, error) {
	if subtle.ConstantTimeCompare([]byte(user), []byte(a.Username)) != 1 ||
		subtle.ConstantTimeCompare([]byte(pass), []byte(a.Password)) != 1 {
		return false, nil
	}
	token, err := randomToken()
	if err != nil {
		return false, err
	}
	if err := a.Catalog.CreateSession(r.Context(), token, sessionTTL); err != nil {
		return false, err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(sessionTTL),
	})
	return true, nil
}

func (a *Authenticator) Logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		_ = a.Catalog.DeleteSession(r.Context(), c.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:    sessionCookie,
		Value:   "",
		Path:    "/",
		Expires: time.Unix(0, 0),
	})
}

func (a *Authenticator) Required(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(sessionCookie)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		ok, err := a.Catalog.ValidateSession(r.Context(), c.Value)
		if err != nil || !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
