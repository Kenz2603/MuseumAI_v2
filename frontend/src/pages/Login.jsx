import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";


const MANAGEMENT_ROLES = new Set([
  "admin",
  "content_staff",
  "ticket_staff",
]);

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("current_user");
}

function getRoleName(user) {
  if (!user) {
    return null;
  }

  if (typeof user.role === "string") {
    return user.role;
  }

  if (user.role?.name) {
    return user.role.name;
  }

  if (user.role_name) {
    return user.role_name;
  }

  return null;
}

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // KIỂM TRA SESSION HIỆN TẠI
  // ============================================================

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    const currentUserRaw =
      localStorage.getItem("current_user");

    if (!currentUserRaw) {
      clearSession();
      return;
    }

    try {
      const currentUser =
        JSON.parse(currentUserRaw);

      const roleName =
        getRoleName(currentUser);

      if (!roleName || !MANAGEMENT_ROLES.has(roleName)) {
        clearSession();
        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch {
      clearSession();
    }
  }, [navigate]);

  // ============================================================
  // INPUT
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  function getErrorMessage(err) {
    const statusCode = err.response?.status;
    const detail = err.response?.data?.detail;

    if (statusCode === 401) {
      if (typeof detail === "string") {
        return detail;
      }

      return "Tên đăng nhập hoặc mật khẩu không chính xác.";
    }

    if (statusCode === 403) {
      if (
        typeof detail === "string" &&
        detail.toLowerCase().includes("khách tham quan")
      ) {
        return (
          "Tài khoản khách tham quan không được phép " +
          "đăng nhập vào hệ thống quản lý. " +
          "Vui lòng sử dụng tài khoản nhân viên được cấp."
        );
      }

      if (typeof detail === "string") {
        return detail;
      }

      return (
        "Tài khoản không được phép đăng nhập " +
        "vào hệ thống quản lý."
      );
    }

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item) =>
            item?.msg ||
            "Dữ liệu không hợp lệ.",
        )
        .join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    if (err.message) {
      return err.message;
    }

    return "Đăng nhập thất bại. Vui lòng thử lại.";
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.username.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (!form.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    // Xóa hoàn toàn session cũ trước khi login.
    clearSession();

    try {
      setLoading(true);

      const response = await api.post(
      "/api/auth/login",
        {
          username: form.username.trim(),
          password: form.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const accessToken =
        response.data?.access_token;

      const tokenType =
        response.data?.token_type || "bearer";

      const currentUser =
        response.data?.user;

      // --------------------------------------------------------
      // Kiểm tra access token
      // --------------------------------------------------------

      if (
        typeof accessToken !== "string" ||
        !accessToken.trim()
      ) {
        throw new Error(
          "Backend không trả về access_token.",
        );
      }

      // --------------------------------------------------------
      // Kiểm tra user
      // --------------------------------------------------------

      if (!currentUser) {
        throw new Error(
          "Backend không trả về thông tin người dùng.",
        );
      }

      // --------------------------------------------------------
      // Kiểm tra role
      // --------------------------------------------------------

      const roleName =
        getRoleName(currentUser);

      if (
        !roleName ||
        !MANAGEMENT_ROLES.has(roleName)
      ) {
        clearSession();

        setError(
          "Tài khoản không được phép đăng nhập " +
          "vào hệ thống quản lý.",
        );

        return;
      }

      // --------------------------------------------------------
      // LƯU SESSION
      //
      // Các thao tác localStorage là synchronous.
      // Vì vậy phải lưu hoàn tất trước khi navigate.
      // --------------------------------------------------------

      localStorage.setItem(
        "access_token",
        accessToken,
      );

      localStorage.setItem(
        "token_type",
        tokenType,
      );

      localStorage.setItem(
        "current_user",
        JSON.stringify(currentUser),
      );

      // --------------------------------------------------------
      // Kiểm tra lại session vừa lưu
      //
      // Điều này giúp tránh trường hợp ProtectedRoute
      // được render mà chưa có dữ liệu session hợp lệ.
      // --------------------------------------------------------

      const savedToken =
        localStorage.getItem("access_token");

      const savedUserRaw =
        localStorage.getItem("current_user");

      if (!savedToken || !savedUserRaw) {
        clearSession();

        throw new Error(
          "Không thể lưu phiên đăng nhập.",
        );
      }

      // --------------------------------------------------------
      // Chuyển vào Dashboard
      // --------------------------------------------------------

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      clearSession();

      setError(
        getErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="login-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top left,
              rgba(37, 99, 235, 0.16),
              transparent 32%
            ),
            #f5f7fb;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 34px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
        }

        .login-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-logo {
          width: 58px;
          height: 58px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #2563eb;
          color: #ffffff;
        }

        .login-title {
          margin: 0;
          color: #111827;
          font-size: 26px;
          font-weight: 700;
        }

        .login-subtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 46px;
          padding: 0 14px 0 42px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          outline: none;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          transition: 0.2s;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .error-box {
          padding: 11px 13px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          line-height: 1.5;
        }

        .login-button {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .login-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .login-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 26px 20px;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={28} />
          </div>

          <h1 className="login-title">
            MuseumAI
          </h1>

          <p className="login-subtitle">
            Hệ thống quản lý bảo tàng
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="username"
            >
              Tên đăng nhập
            </label>

            <div className="input-wrapper">
              <UserRound
                className="input-icon"
                size={18}
              />

              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label
              className="form-label"
              htmlFor="password"
            >
              Mật khẩu
            </label>

            <div className="input-wrapper">
              <LockKeyhole
                className="input-icon"
                size={18}
              />

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  style={{
                    animation:
                      "spin 1s linear infinite",
                  }}
                />

                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={18} />

                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          MuseumAI © 2026
        </div>
      </div>
    </div>
  );
}