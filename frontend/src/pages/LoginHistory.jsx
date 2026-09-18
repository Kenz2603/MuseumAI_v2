import { useEffect, useState } from "react";
import { History, RefreshCw, ShieldCheck } from "lucide-react";

import api from "../api/axios";

const ROLE_LABELS = {
  admin: "Quản trị viên",
  content_staff: "Nhân viên nội dung",
  ticket_staff: "Nhân viên vé",
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Không xác định";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function LoginHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLoginHistory() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Phiên đăng nhập không tồn tại.");
        return;
      }

      const response = await api.get("/api/auth/login-history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems(response.data?.items || []);
      setTotal(response.data?.total || 0);
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Chỉ quản trị viên mới được xem lịch sử đăng nhập.");
      } else {
        setError(
          requestError.response?.data?.detail ||
            "Không thể tải lịch sử đăng nhập."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoginHistory();
  }, []);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <History size={28} />

            <h2>Lịch sử đăng nhập</h2>
          </div>

          <p>
            Theo dõi lịch sử đăng nhập của các tài khoản quản lý hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLoginHistory}
          disabled={loading}
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <RefreshCw
            size={17}
            style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />

          Làm mới
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          padding: "14px 16px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <ShieldCheck size={20} />

        <span>
          Tổng số lượt đăng nhập được ghi nhận:{" "}
          <strong>{total}</strong>
        </span>
      </div>

      {error && (
        <div
          style={{
            padding: "14px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "760px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <th style={tableHeaderStyle}>STT</th>
              <th style={tableHeaderStyle}>Tài khoản</th>
              <th style={tableHeaderStyle}>Họ và tên</th>
              <th style={tableHeaderStyle}>Quyền</th>
              <th style={tableHeaderStyle}>Thời gian đăng nhập</th>
              <th style={tableHeaderStyle}>Địa chỉ IP</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Đang tải lịch sử đăng nhập...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Chưa có lịch sử đăng nhập.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <td style={tableCellStyle}>{index + 1}</td>

                  <td
                    style={{
                      ...tableCellStyle,
                      fontWeight: 600,
                    }}
                  >
                    {item.username}
                  </td>

                  <td style={tableCellStyle}>{item.full_name}</td>

                  <td style={tableCellStyle}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 10px",
                        borderRadius: "999px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "13px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getRoleLabel(item.role)}
                    </span>
                  </td>

                  <td
                    style={{
                      ...tableCellStyle,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(item.login_at)}
                  </td>

                  <td
                    style={{
                      ...tableCellStyle,
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.ip_address || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 700px) {
            .page-header {
              gap: 12px !important;
            }

            .page-header button {
              width: 100%;
              justify-content: center;
            }
          }
        `}
      </style>
    </section>
  );
}

const tableHeaderStyle = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 700,
  color: "#475569",
  whiteSpace: "nowrap",
};

const tableCellStyle = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "#334155",
};