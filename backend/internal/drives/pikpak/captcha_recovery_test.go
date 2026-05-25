package pikpak

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/go-resty/resty/v2"
)

// writeErrorJSON 模拟 PikPak 在业务错误时返回 4xx + JSON body 的行为；
// 这是 resty 把 body 解到 SetError(&e) 的前提（2xx 只解 SetResult）。
func writeErrorJSON(w http.ResponseWriter, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_, _ = w.Write([]byte(body))
}

// TestRefreshCaptchaTokenRecoversFrom4002 验证 refreshCaptchaToken 在
// 服务端返回 error_code=4002 时会清空缓存的 captcha_token 后自动重试一次：
//
//   - 第一次调用：body 里携带过期 token "expired-captcha"，服务端回 4002
//   - 内部检测到 4002 + captchaToken 非空 → 清空 d.captchaToken
//   - 第二次调用：body 里 captcha_token 为空字符串，服务端发回新 token
//
// 这覆盖 driver 重启后 Init() → refreshCaptchaTokenAtLogin 用持久化的旧
// captcha_token 调 /v1/shield/captcha/init 直接被拒的场景。
func TestRefreshCaptchaTokenRecoversFrom4002(t *testing.T) {
	var calls int32
	type bodyShape struct {
		CaptchaToken string `json:"captcha_token"`
	}
	var (
		firstBody  bodyShape
		secondBody bodyShape
	)

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/shield/captcha/init", func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt32(&calls, 1)
		switch n {
		case 1:
			_ = json.NewDecoder(r.Body).Decode(&firstBody)
			writeErrorJSON(w, `{
				"error_code": 4002,
				"error": "captcha_invalid",
				"error_description": "Code(4002) - captcha_token expired"
			}`)
		case 2:
			_ = json.NewDecoder(r.Body).Decode(&secondBody)
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{
				"captcha_token": "fresh-captcha",
				"expires_in": 300
			}`))
		default:
			t.Errorf("unexpected captcha init call #%d", n)
		}
	})
	server := httptest.NewServer(mux)
	defer server.Close()

	d := newTestDriver(t, server)
	d.captchaToken = "expired-captcha"
	persisted := struct {
		access, refresh, captcha, deviceID string
	}{}
	d.onTokenUpdate = func(access, refresh, captcha, deviceID string) {
		persisted.access = access
		persisted.refresh = refresh
		persisted.captcha = captcha
		persisted.deviceID = deviceID
	}

	if err := d.refreshCaptchaTokenAtLogin(context.Background(), "GET:/drive/v1/files", "user-1"); err != nil {
		t.Fatalf("refreshCaptchaTokenAtLogin: %v", err)
	}

	if got := atomic.LoadInt32(&calls); got != 2 {
		t.Fatalf("captcha init called %d times, want 2", got)
	}
	if firstBody.CaptchaToken != "expired-captcha" {
		t.Errorf("first body captcha_token = %q, want \"expired-captcha\"", firstBody.CaptchaToken)
	}
	if secondBody.CaptchaToken != "" {
		t.Errorf("second body captcha_token = %q, want empty (cleared after 4002)", secondBody.CaptchaToken)
	}
	if d.captchaToken != "fresh-captcha" {
		t.Errorf("d.captchaToken = %q, want \"fresh-captcha\"", d.captchaToken)
	}
	if persisted.captcha != "fresh-captcha" {
		t.Errorf("onTokenUpdate captcha = %q, want \"fresh-captcha\"", persisted.captcha)
	}
}

// TestRefreshCaptchaTokenDoesNotLoopOn4002WithEmptyToken 防止退化成无限重试：
// 如果调用方一开始 captchaToken 就是空，又遇上 4002，不应该再清空一次重试
// （清空后还是空，再发会拿到同样的错误），应该直接返回错误让上层处理。
func TestRefreshCaptchaTokenDoesNotLoopOn4002WithEmptyToken(t *testing.T) {
	var calls int32
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/shield/captcha/init", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&calls, 1)
		writeErrorJSON(w, `{"error_code": 4002, "error": "captcha_invalid"}`)
	})
	server := httptest.NewServer(mux)
	defer server.Close()

	d := newTestDriver(t, server)
	d.captchaToken = "" // 起点就是空

	err := d.refreshCaptchaTokenAtLogin(context.Background(), "GET:/drive/v1/files", "user-1")
	if err == nil {
		t.Fatal("expected error from refreshCaptchaTokenAtLogin")
	}
	if got := atomic.LoadInt32(&calls); got != 1 {
		t.Fatalf("captcha init called %d times, want 1 (no retry when token already empty)", got)
	}
}

// TestRequestOnceRecoversFrom4002OnAPICall 验证一个普通 API 调用收到 4002
// 时，requestOnce 会先清空 captchaToken、再走 captcha 刷新，最后用新 token
// 重试请求，最终成功返回。
//
// 用 /drive/v1/files 这个真实存在的端点做载体（List 内部会走它）。
func TestRequestOnceRecoversFrom4002OnAPICall(t *testing.T) {
	var (
		filesCalls   int32
		captchaCalls int32
	)
	type capturedFiles struct {
		captchaHeader string
	}
	var firstFiles, secondFiles capturedFiles

	mux := http.NewServeMux()
	mux.HandleFunc("/drive/v1/files", func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt32(&filesCalls, 1)
		switch n {
		case 1:
			firstFiles.captchaHeader = r.Header.Get("X-Captcha-Token")
			writeErrorJSON(w, `{
				"error_code": 4002,
				"error": "captcha_invalid",
				"error_description": "Code(4002) - captcha_token expired"
			}`)
		case 2:
			secondFiles.captchaHeader = r.Header.Get("X-Captcha-Token")
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"files": [], "next_page_token": ""}`))
		default:
			t.Errorf("unexpected /drive/v1/files call #%d", n)
		}
	})
	mux.HandleFunc("/v1/shield/captcha/init", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&captchaCalls, 1)
		// 验证 4002 路径先把 captchaToken 清空了，所以 captcha init 的 body 里
		// 不会再带过期 token。
		var body struct {
			CaptchaToken string `json:"captcha_token"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body.CaptchaToken != "" {
			t.Errorf("captcha init body captcha_token = %q, want empty (4002 path should clear cache)", body.CaptchaToken)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"captcha_token": "fresh-captcha", "expires_in": 300}`))
	})
	server := httptest.NewServer(mux)
	defer server.Close()

	d := newTestDriver(t, server)
	d.captchaToken = "expired-captcha"

	if _, err := d.List(context.Background(), "any-parent"); err != nil {
		t.Fatalf("List: %v", err)
	}

	if got := atomic.LoadInt32(&filesCalls); got != 2 {
		t.Fatalf("/drive/v1/files calls = %d, want 2 (initial + retry)", got)
	}
	if got := atomic.LoadInt32(&captchaCalls); got != 1 {
		t.Fatalf("captcha init calls = %d, want 1", got)
	}
	if firstFiles.captchaHeader != "expired-captcha" {
		t.Errorf("first request X-Captcha-Token = %q, want \"expired-captcha\"", firstFiles.captchaHeader)
	}
	if secondFiles.captchaHeader != "fresh-captcha" {
		t.Errorf("retry X-Captcha-Token = %q, want \"fresh-captcha\"", secondFiles.captchaHeader)
	}
	if d.captchaToken != "fresh-captcha" {
		t.Errorf("d.captchaToken after recovery = %q, want \"fresh-captcha\"", d.captchaToken)
	}
}

// TestRequestOnceDoesNotRetryTwiceOn4002 验证 4002 恢复路径只重试一次；
// 如果重试请求依然失败（哪怕是再来一个 4002），也不会再次进入恢复逻辑，
// 而是把错误返回出去，避免无限循环。
func TestRequestOnceDoesNotRetryTwiceOn4002(t *testing.T) {
	var filesCalls int32
	mux := http.NewServeMux()
	mux.HandleFunc("/drive/v1/files", func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&filesCalls, 1)
		writeErrorJSON(w, `{"error_code": 4002, "error": "captcha_invalid"}`)
	})
	mux.HandleFunc("/v1/shield/captcha/init", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"captcha_token": "fresh-captcha", "expires_in": 300}`))
	})
	server := httptest.NewServer(mux)
	defer server.Close()

	d := newTestDriver(t, server)
	d.captchaToken = "expired-captcha"
	// 用一个独立 client，避免被前面 test 修改的 transport 残留影响
	d.client = resty.New().SetHeader("Accept", "application/json")
	d.client.SetTransport(&rewritingTransport{
		base:   http.DefaultTransport,
		target: server.Listener.Addr().String(),
	})

	_, err := d.List(context.Background(), "any-parent")
	if err == nil {
		t.Fatal("expected error when retry also fails with 4002")
	}
	if got := atomic.LoadInt32(&filesCalls); got != 2 {
		t.Fatalf("/drive/v1/files calls = %d, want 2 (one retry only)", got)
	}
}
