import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Copy,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";

import api from "../api/axios";

/* ============================================================
   CONSTANTS
============================================================ */

/* ============================================================
   HELPERS
============================================================ */

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function createConversation() {
  const now = Date.now();

  return {
    id: createId(),
    title: "Đoạn chat mới",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("vi-VN").format(number);
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("vi-VN").format(
    number
  )} VNĐ`;
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getDataLabel(key) {
  const labels = {
    count: "Số lượng",
    ticket_count: "Số vé",
    revenue: "Doanh thu",
    year: "Năm",
    month: "Tháng",
    period: "Thời gian",
    total_feedbacks: "Tổng feedback",
    average_rating: "Điểm trung bình",
    positive_count: "Feedback tích cực",
    neutral_count: "Feedback trung lập",
    negative_count: "Feedback tiêu cực",
    label: "Thời gian",
  };

  return labels[key] || key;
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.msg ||
          "Dữ liệu gửi tới máy chủ không hợp lệ."
        );
      })
      .join(", ");
  }

  if (
    detail &&
    typeof detail === "object"
  ) {
    if (typeof detail.msg === "string") {
      return detail.msg;
    }

    return "Dữ liệu gửi tới máy chủ chưa đúng định dạng.";
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện yêu cầu phân tích này.";
  }

  if (status === 422) {
    return "Dữ liệu yêu cầu không đúng định dạng mà API yêu cầu.";
  }

  if (status === 400) {
    return "Câu hỏi chưa hợp lệ hoặc chưa xác định được yêu cầu phân tích.";
  }

  if (status === 503) {
    return "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.";
  }

  if (error?.message) {
    return error.message;
  }

  return "Không thể kết nối tới hệ thống phân tích AI.";
}

function normalizeAnswer(answer) {
  if (typeof answer === "string") {
    return answer;
  }

  if (
    answer !== null &&
    answer !== undefined
  ) {
    try {
      return JSON.stringify(
        answer,
        null,
        2
      );
    } catch {
      return String(answer);
    }
  }

  return "Không có câu trả lời.";
}

function getConversationTitle(question) {
  const clean = question
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "Đoạn chat mới";
  }

  if (clean.length <= 42) {
    return clean;
  }

  return `${clean.slice(0, 42)}...`;
}

function isToday(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isYesterday(timestamp) {
  const date = new Date(timestamp);
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  return (
    date.getFullYear() ===
      yesterday.getFullYear() &&
    date.getMonth() ===
      yesterday.getMonth() &&
    date.getDate() ===
      yesterday.getDate()
  );
}

/* ============================================================
   RESULT COMPONENTS
============================================================ */

function SummaryCards({ data }) {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const entries = Object.entries(data).filter(
    ([, value]) =>
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
  );

  if (!entries.length) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "12px",
        marginTop: "16px",
      }}
    >
      {entries.map(([key, value]) => {
        let displayValue = value;

        if (key === "revenue") {
          displayValue =
            formatCurrency(value);
        } else if (
          key === "average_rating"
        ) {
          displayValue =
            Number(value || 0).toFixed(2);
        } else if (
          typeof value === "number"
        ) {
          displayValue =
            formatNumber(value);
        }

        return (
          <div
            key={key}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "14px 16px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "7px",
              }}
            >
              {getDataLabel(key)}
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              {displayValue}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataTable({ data }) {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray(data.rows) ||
    !data.rows.length
  ) {
    return null;
  }

  const columns = Object.keys(
    data.rows[0]
  );

  return (
    <div
      style={{
        marginTop: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom:
            "1px solid #e5e7eb",
          fontWeight: 600,
          color: "#334155",
        }}
      >
        Dữ liệu chi tiết
      </div>

      <div
        style={{
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f8fafc",
              }}
            >
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    padding:
                      "11px 14px",
                    textAlign: "left",
                    color: "#475569",
                    fontWeight: 600,
                    whiteSpace:
                      "nowrap",
                    borderBottom:
                      "1px solid #e5e7eb",
                  }}
                >
                  {getDataLabel(
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.rows.map(
              (row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    borderBottom:
                      "1px solid #f1f5f9",
                  }}
                >
                  {columns.map(
                    (column) => {
                      const value =
                        row[column];

                      let displayValue =
                        value;

                      if (
                        column ===
                        "revenue"
                      ) {
                        displayValue =
                          formatCurrency(
                            value
                          );
                      } else if (
                        typeof value ===
                        "number"
                      ) {
                        displayValue =
                          formatNumber(
                            value
                          );
                      } else if (
                        value !== null &&
                        typeof value ===
                          "object"
                      ) {
                        displayValue =
                          JSON.stringify(
                            value
                          );
                      }

                      return (
                        <td
                          key={column}
                          style={{
                            padding:
                              "11px 14px",
                            color:
                              "#334155",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {String(
                            displayValue ??
                              "—"
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyRevenueChart({
  chart,
  data,
}) {
  if (
    !chart ||
    chart.type !== "bar" ||
    !data ||
    !Array.isArray(data.rows) ||
    !data.rows.length
  ) {
    return null;
  }

  const rows = data.rows;
  const revenues = rows.map(
    (row) => Number(row.revenue) || 0
  );

  const maxRevenue = Math.max(...revenues, 1);
  const gridMax = Math.ceil(maxRevenue / 20000) * 20000 || 20000;
  const gridStep = gridMax / 4;
  const gridValues = [
    gridMax,
    gridStep * 3,
    gridStep * 2,
    gridStep,
    0,
  ];

  return (
    <div
      style={{
        marginTop: "16px",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        background: "#ffffff",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            {chart.title || "Doanh thu theo tháng"}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Đơn vị: {chart.unit || "VND"}
          </div>
        </div>

        <span
          style={{
            fontSize: "12px",
            color: "#64748b",
            whiteSpace: "nowrap",
          }}
        >
          {data.year ? `Năm ${data.year}` : ""}
        </span>
      </div>

      <div
        style={{
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        <div
          style={{
            minWidth: "720px",
            height: "350px",
            display: "grid",
            gridTemplateColumns: "58px minmax(0, 1fr)",
            gridTemplateRows: "1fr 34px",
            columnGap: "10px",
          }}
        >
          <div
            style={{
              gridColumn: "1",
              gridRow: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: "0 0 0 0",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            {gridValues.map((value) => (
              <span key={value}>
                {formatNumber(value)}
              </span>
            ))}
          </div>

          <div
            style={{
              gridColumn: "2",
              gridRow: "1",
              position: "relative",
              borderLeft: "1px solid #cbd5e1",
              borderBottom: "1px solid #cbd5e1",
              backgroundImage:
                "linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "100% 25%",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "0 8px 0 8px",
                display: "flex",
                alignItems: "flex-end",
                gap: "clamp(5px, 1.1vw, 14px)",
              }}
            >
              {rows.map((row) => {
                const revenue = Number(row.revenue) || 0;
                const height = Math.min(
                  (revenue / gridMax) * 100,
                  100
                );

                return (
                  <div
                    key={row.month ?? row.label}
                    style={{
                      flex: "1 1 0",
                      minWidth: "32px",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    {revenue > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: `calc(${height}% + 6px)`,
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#2563eb",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatNumber(revenue)}
                      </span>
                    )}

                    <div
                      title={`${row.label}: ${formatCurrency(revenue)}`}
                      style={{
                        width: "min(48px, 100%)",
                        height: `${height}%`,
                        minHeight: revenue > 0 ? "4px" : "0",
                        background: "#2563eb",
                        borderRadius: "5px 5px 0 0",
                        transition: "height 180ms ease",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              gridColumn: "2",
              gridRow: "2",
              display: "flex",
              alignItems: "flex-start",
              gap: "clamp(5px, 1.1vw, 14px)",
              padding: "9px 8px 0",
            }}
          >
            {rows.map((row) => (
              <div
                key={row.month ?? row.label}
                style={{
                  flex: "1 1 0",
                  minWidth: "32px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {row.label || `Tháng ${row.month}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "7px",
          marginTop: "8px",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#2563eb",
            display: "inline-block",
          }}
        />
        <span>Doanh thu ({chart.unit || "VND"})</span>
      </div>
    </div>
  );
}

function FeedbackAnalysis({
  data,
}) {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const summary = {
    total_feedbacks:
      data.total_feedbacks,
    average_rating:
      data.average_rating,
    positive_count:
      data.positive_count,
    neutral_count:
      data.neutral_count,
    negative_count:
      data.negative_count,
  };

  return (
    <div>
      <SummaryCards
        data={summary}
      />

      {data.sentiment_summary && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: "8px",
              color: "#334155",
            }}
          >
            Xu hướng cảm xúc
          </div>

          <div
            style={{
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            {String(
              data.sentiment_summary
            )}
          </div>
        </div>
      )}

      {Array.isArray(
        data.positive_points
      ) &&
        data.positive_points.length >
          0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              border:
                "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Điểm tích cực
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft:
                  "20px",
                lineHeight: 1.8,
                color:
                  "#475569",
              }}
            >
              {data.positive_points.map(
                (item, index) => (
                  <li key={index}>
                    {String(item)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {Array.isArray(
        data.negative_points
      ) &&
        data.negative_points.length >
          0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              border:
                "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Vấn đề cần lưu ý
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft:
                  "20px",
                lineHeight: 1.8,
                color:
                  "#475569",
              }}
            >
              {data.negative_points.map(
                (item, index) => (
                  <li key={index}>
                    {String(item)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {Array.isArray(
        data.themes
      ) &&
        data.themes.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            {data.themes.map(
              (theme, index) => {
                const name =
                  typeof theme ===
                  "object"
                    ? theme.name
                    : theme;

                const sentiment =
                  typeof theme ===
                  "object"
                    ? theme.sentiment
                    : "neutral";

                return (
                  <div
                    key={index}
                    style={{
                      padding:
                        "14px",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "12px",
                      background:
                        "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          600,
                        color:
                          "#334155",
                        marginBottom:
                          "6px",
                      }}
                    >
                      {String(
                        name ||
                          "Chủ đề"
                      )}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "12px",
                        color:
                          "#64748b",
                      }}
                    >
                      {sentiment ===
                      "positive"
                        ? "Tích cực"
                        : sentiment ===
                          "negative"
                          ? "Tiêu cực"
                          : "Trung lập"}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

      {Array.isArray(
        data.recommendations
      ) &&
        data.recommendations.length >
          0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              border:
                "1px solid #e5e7eb",
              borderRadius: "12px",
              background:
                "#ffffff",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Đề xuất cải thiện
            </div>

            <ol
              style={{
                margin: 0,
                paddingLeft:
                  "20px",
                lineHeight: 1.8,
                color:
                  "#475569",
              }}
            >
              {data.recommendations.map(
                (item, index) => (
                  <li key={index}>
                    {String(item)}
                  </li>
                )
              )}
            </ol>
          </div>
        )}

      {data.conclusion && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "12px",
            background:
              "#ffffff",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Kết luận
          </div>

          <div
            style={{
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            {String(
              data.conclusion
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantResult({
  message,
}) {
  const response =
    message?.response;

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return null;
  }

  const data = response.data;

  if (!data) {
    return null;
  }

  if (
    response.intent ===
    "feedback_analysis"
  ) {
    return (
      <FeedbackAnalysis
        data={data}
      />
    );
  }

  return (
    <div>
      <SummaryCards
        data={data}
      />

      {response.intent ===
        "ticket_revenue_by_month" &&
        Array.isArray(
          data.rows
        ) && (
          <MonthlyRevenueChart
            chart={response.chart}
            data={data}
          />
        )}

      <DataTable
        data={data}
      />
    </div>
  );
}

/* ============================================================
   MESSAGE BUBBLE
============================================================ */

function MessageBubble({
  message,
  onCopy,
}) {
  const isUser =
    message.role === "user";

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: isUser
          ? "flex-end"
          : "flex-start",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "850px",
          display: "flex",
          flexDirection:
            isUser
              ? "row-reverse"
              : "row",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            minWidth: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isUser
              ? "#e2e8f0"
              : "#111827",
            color: isUser
              ? "#334155"
              : "#ffffff",
          }}
        >
          {isUser ? (
            <User size={17} />
          ) : (
            <Bot size={17} />
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              marginBottom: "6px",
            }}
          >
            {isUser
              ? "Bạn"
              : "MuseumAI"}
          </div>

          <div
            style={{
              padding: isUser
                ? "11px 15px"
                : "0",
              borderRadius:
                "14px",
              background: isUser
                ? "#f1f5f9"
                : "transparent",
              color: "#1e293b",
              lineHeight: 1.75,
              whiteSpace:
                "pre-wrap",
              overflowWrap:
                "anywhere",
              fontSize: "14px",
            }}
          >
            {String(
              message.content ||
                ""
            )}
          </div>

          {!isUser &&
            message.response && (
              <AssistantResult
                message={message}
              />
            )}

          {!isUser &&
            !message.error && (
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    message.content
                  )
                }
                style={{
                  marginTop: "10px",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: "5px",
                  border: "none",
                  background:
                    "transparent",
                  color:
                    "#94a3b8",
                  fontSize:
                    "12px",
                  cursor:
                    "pointer",
                  padding:
                    "4px 0",
                }}
              >
                <Copy size={14} />
                Sao chép
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function AIAnalysis() {
  const [conversations, setConversations] =
    useState([]);

  const [activeId, setActiveId] =
    useState(null);

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  /* ----------------------------------------------------------
     INIT TEMPORARY HISTORY

     Lịch sử chỉ tồn tại trong state của trang hiện tại.
     Không lưu vào localStorage/database.
     Khi F5 hoặc đóng trang, lịch sử sẽ được tạo lại từ đầu.
  ---------------------------------------------------------- */

  useEffect(() => {
    const conversation = createConversation();

    setConversations([conversation]);
    setActiveId(conversation.id);
  }, []);

  /* ----------------------------------------------------------
     ACTIVE CONVERSATION
  ---------------------------------------------------------- */

  const activeConversation =
    useMemo(
      () =>
        conversations.find(
          (item) =>
            item.id === activeId
        ) || null,
      [
        conversations,
        activeId,
      ]
    );

  const messages =
    activeConversation?.messages ||
    [];

  /* ----------------------------------------------------------
     AUTO SCROLL
  ---------------------------------------------------------- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages, loading]);

  /* ----------------------------------------------------------
     FOCUS INPUT
  ---------------------------------------------------------- */

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [activeId]);

  /* ----------------------------------------------------------
     GROUP HISTORY
  ---------------------------------------------------------- */

  const groupedConversations =
    useMemo(() => {
      const sorted =
        [...conversations].sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        );

      const today = [];
      const yesterday = [];
      const older = [];

      sorted.forEach(
        (conversation) => {
          if (
            isToday(
              conversation.updatedAt
            )
          ) {
            today.push(
              conversation
            );
          } else if (
            isYesterday(
              conversation.updatedAt
            )
          ) {
            yesterday.push(
              conversation
            );
          } else {
            older.push(
              conversation
            );
          }
        }
      );

      return {
        today,
        yesterday,
        older,
      };
    }, [conversations]);

  /* ----------------------------------------------------------
     NEW CHAT
  ---------------------------------------------------------- */

  function handleNewChat() {
    if (loading) {
      return;
    }

    const conversation =
      createConversation();

    setConversations(
      (current) => [
        conversation,
        ...current,
      ]
    );

    setActiveId(
      conversation.id
    );

    setQuestion("");
    setError("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  /* ----------------------------------------------------------
     SELECT CHAT
  ---------------------------------------------------------- */

  function handleSelectConversation(
    id
  ) {
    if (loading) {
      return;
    }

    setActiveId(id);
    setQuestion("");
    setError("");
  }

  /* ----------------------------------------------------------
     DELETE CHAT
  ---------------------------------------------------------- */

  function handleDeleteConversation(
    id,
    event
  ) {
    event?.stopPropagation();

    if (loading) {
      return;
    }

    setConversations(
      (current) => {
        const remaining =
          current.filter(
            (item) =>
              item.id !== id
          );

        if (!remaining.length) {
          const newConversation =
            createConversation();

          setActiveId(
            newConversation.id
          );

          return [
            newConversation,
          ];
        }

        if (id === activeId) {
          setActiveId(
            remaining[0].id
          );
        }

        return remaining;
      }
    );

    setQuestion("");
    setError("");
  }

  /* ----------------------------------------------------------
     SEND MESSAGE
  ---------------------------------------------------------- */

  async function sendMessage(
    messageText = question
  ) {
    const message =
      messageText.trim();

    if (
      !message ||
      loading ||
      !activeConversation
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại."
      );

      return;
    }

    const userMessage = {
      id: createId(),
      role: "user",
      content: message,
      createdAt: Date.now(),
    };

    const previousMessages =
      activeConversation.messages ||
      [];

    /*
     * Backend contract:
     *
     * {
     *   message,
     *   history
     * }
     *
     * History được gửi gồm các tin nhắn
     * trước đó và câu hỏi hiện tại.
     */
    const history = [
      ...previousMessages,
      userMessage,
    ]
      .filter(
        (item) =>
          item.role ===
            "user" ||
          item.role ===
            "assistant"
      )
      .map((item) => ({
        role: item.role,
        content:
          item.content,
      }));

    const optimisticMessages = [
      ...previousMessages,
      userMessage,
    ];

    setConversations(
      (current) =>
        current.map(
          (conversation) => {
            if (
              conversation.id !==
              activeId
            ) {
              return conversation;
            }

            return {
              ...conversation,
              title:
                conversation.messages
                  ?.length === 0
                  ? getConversationTitle(
                      message
                    )
                  : conversation.title,
              messages:
                optimisticMessages,
              updatedAt:
                Date.now(),
            };
          }
        )
    );

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const result =
        await api.post(
          "/api/ai/chat",
          {
            message,
            history,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        result?.data;

      if (
        !data ||
        typeof data !==
          "object"
      ) {
        throw new Error(
          "Backend không trả về dữ liệu hợp lệ."
        );
      }

      const assistantMessage =
        {
          id: createId(),
          role: "assistant",
          content:
            normalizeAnswer(
              data.answer
            ),
          response: data,
          createdAt:
            Date.now(),
        };

      setConversations(
        (current) =>
          current.map(
            (conversation) => {
              if (
                conversation.id !==
                activeId
              ) {
                return conversation;
              }

              return {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  assistantMessage,
                ],
                updatedAt:
                  Date.now(),
              };
            }
          )
      );
    } catch (requestError) {
      console.error(
        "[MuseumAI] AI Analysis error:",
        requestError
      );

      const errorText =
        getErrorMessage(
          requestError
        );

      setError(errorText);

      const assistantErrorMessage =
        {
          id: createId(),
          role: "assistant",
          content: errorText,
          error: true,
          createdAt:
            Date.now(),
        };

      setConversations(
        (current) =>
          current.map(
            (conversation) => {
              if (
                conversation.id !==
                activeId
              ) {
                return conversation;
              }

              return {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  assistantErrorMessage,
                ],
                updatedAt:
                  Date.now(),
              };
            }
          )
      );
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

  function handleSubmit(event) {
    event.preventDefault();

    sendMessage();
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  /* ----------------------------------------------------------
     COPY
  ---------------------------------------------------------- */

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(
        String(text || "")
      );
    } catch {
      console.warn(
        "[MuseumAI] Không thể sao chép nội dung."
      );
    }
  }

  /* ----------------------------------------------------------
     EXAMPLE QUESTIONS
  ---------------------------------------------------------- */

  function handleExample(
    value
  ) {
    setQuestion(value);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  /* ----------------------------------------------------------
     RENDER HISTORY SECTION
  ---------------------------------------------------------- */

  function renderHistorySection(
    title,
    items
  ) {
    if (!items.length) {
      return null;
    }

    return (
      <div
        key={title}
        style={{
          marginTop: "20px",
        }}
      >
        <div
          style={{
            padding:
              "0 10px 8px",
            fontSize: "11px",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform:
              "uppercase",
            letterSpacing:
              "0.04em",
          }}
        >
          {title}
        </div>

        {items.map(
          (conversation) => {
            const active =
              conversation.id ===
              activeId;

            return (
              <button
                key={
                  conversation.id
                }
                type="button"
                onClick={() =>
                  handleSelectConversation(
                    conversation.id
                  )
                }
                style={{
                  width: "100%",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  padding:
                    "10px",
                  border: "none",
                  borderRadius:
                    "9px",
                  background:
                    active
                      ? "#e2e8f0"
                      : "transparent",
                  color:
                    "#334155",
                  textAlign:
                    "left",
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                  marginBottom:
                    "2px",
                }}
              >
                <MessageSquare
                  size={16}
                  style={{
                    minWidth:
                      "16px",
                    color:
                      active
                        ? "#334155"
                        : "#64748b",
                  }}
                />

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                    fontSize:
                      "13px",
                  }}
                >
                  {conversation.title ||
                    "Đoạn chat mới"}
                </span>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) =>
                    handleDeleteConversation(
                      conversation.id,
                      event
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" ||
                      event.key ===
                        " "
                    ) {
                      event.preventDefault();

                      handleDeleteConversation(
                        conversation.id,
                        event
                      );
                    }
                  }}
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    width: "24px",
                    height: "24px",
                    borderRadius:
                      "6px",
                    color:
                      "#94a3b8",
                    flexShrink: 0,
                  }}
                  title="Xóa đoạn chat"
                >
                  <Trash2
                    size={14}
                  />
                </span>
              </button>
            );
          }
        )}
      </div>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "calc(100dvh - 150px)",
        minHeight: "0",
        maxHeight: "calc(100dvh - 150px)",
        background:
          "#ffffff",
        border:
          "1px solid #e5e7eb",
        borderRadius:
          "14px",
        overflow: "hidden",
        boxShadow:
          "0 1px 3px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* ======================================================
          CHAT SIDEBAR
      ====================================================== */}

      <aside
        className={
          sidebarOpen
            ? "museumai-sidebar museumai-sidebar-open"
            : "museumai-sidebar museumai-sidebar-closed"
        }
        style={{
          width: sidebarOpen
            ? "260px"
            : "0",
          minWidth: sidebarOpen
            ? "260px"
            : "0",
          overflow: "hidden",
          transition:
            "width 0.2s ease, min-width 0.2s ease",
          borderRight:
            sidebarOpen
              ? "1px solid #e5e7eb"
              : "none",
          background:
            "#f8fafc",
          display: "flex",
          flexDirection:
            "column",
        }}
      >
        <div
          style={{
            padding: "12px",
          }}
        >
          <button
            type="button"
            onClick={
              handleNewChat
            }
            disabled={loading}
            style={{
              width: "100%",
              height: "42px",
              display:
                "flex",
              alignItems:
                "center",
              gap: "9px",
              padding:
                "0 12px",
              border:
                "1px solid #cbd5e1",
              borderRadius:
                "9px",
              background:
                "#ffffff",
              color:
                "#334155",
              fontSize:
                "13px",
              fontWeight: 600,
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading
                  ? 0.6
                  : 1,
            }}
          >
            <Plus size={17} />
            Đoạn chat mới
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY:
              "auto",
            padding:
              "0 8px 14px",
          }}
        >
          {renderHistorySection(
            "Hôm nay",
            groupedConversations.today
          )}

          {renderHistorySection(
            "Hôm qua",
            groupedConversations.yesterday
          )}

          {renderHistorySection(
            "Trước đó",
            groupedConversations.older
          )}
        </div>

        <div
          style={{
            padding:
              "12px",
            borderTop:
              "1px solid #e5e7eb",
            fontSize:
              "11px",
            color:
              "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Lịch sử chỉ tồn tại trong
          phiên làm việc hiện tại.
        </div>
      </aside>

      {/* ======================================================
          MAIN CHAT
      ====================================================== */}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection:
            "column",
          background:
            "#ffffff",
        }}
      >
        {/* CHAT HEADER */}

        <header
          style={{
            height: "56px",
            minHeight: "56px",
            display:
              "flex",
            alignItems:
              "center",
            gap: "10px",
            padding:
              "0 18px",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                (value) =>
                  !value
              )
            }
            style={{
              width: "34px",
              height: "34px",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              border: "none",
              borderRadius:
                "8px",
              background:
                "#f8fafc",
              color:
                "#475569",
              cursor:
                "pointer",
            }}
            title={
              sidebarOpen
                ? "Ẩn lịch sử"
                : "Hiện lịch sử"
            }
          >
            {sidebarOpen ? (
              <ChevronLeft
                size={18}
              />
            ) : (
              <ChevronRight
                size={18}
              />
            )}
          </button>

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "9px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius:
                  "50%",
                background:
                  "#111827",
                color:
                  "#ffffff",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Bot size={17} />
            </div>

            <div>
              <div
                style={{
                  fontSize:
                    "14px",
                  fontWeight:
                    600,
                  color:
                    "#1e293b",
                }}
              >
                MuseumAI
              </div>

              <div
                style={{
                  fontSize:
                    "11px",
                  color:
                    "#64748b",
                }}
              >
                Phân tích dữ liệu
              </div>
            </div>
          </div>

          <div
            style={{
              marginLeft:
                "auto",
              fontSize:
                "11px",
              color:
                "#94a3b8",
            }}
          >
            {activeConversation?.messages
              ?.length
              ? `${activeConversation.messages.length} tin nhắn`
              : ""}
          </div>
        </header>

        {/* ====================================================
            MESSAGE AREA
        ==================================================== */}

        <div
          style={{
            flex: 1,
            overflowY:
              "auto",
            padding:
              "clamp(16px, 3vw, 30px) clamp(12px, 3vw, 24px) 10px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth:
                "900px",
              margin:
                "0 auto",
            }}
          >
            {/* EMPTY CHAT */}

            {!messages.length &&
              !loading && (
                <div
                  style={{
                    minHeight:
                      "100%",
                    height: "100%",
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    padding:
                      "clamp(24px, 5vh, 70px) 12px",
                  }}
                >
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius:
                        "50%",
                      background:
                        "#111827",
                      color:
                        "#ffffff",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      marginBottom:
                        "18px",
                    }}
                  >
                    <Bot
                      size={27}
                    />
                  </div>

                  <h2
                    style={{
                      margin:
                        "0 0 8px",
                      fontSize:
                        "24px",
                      color:
                        "#1e293b",
                    }}
                  >
                    Bạn muốn phân tích
                    điều gì?
                  </h2>

                  <p
                    style={{
                      maxWidth:
                        "600px",
                      margin:
                        "0 auto 30px",
                      textAlign:
                        "center",
                      fontSize:
                        "14px",
                      lineHeight:
                        1.7,
                      color:
                        "#64748b",
                    }}
                  >
                    Hỏi MuseumAI về hiện
                    vật, triển lãm, khách
                    tham quan, vé, phản hồi
                    hoặc doanh thu dựa trên
                    dữ liệu thực tế trong hệ
                    thống.
                  </p>

                  <div
                    style={{
                      width:
                        "100%",
                      maxWidth:
                        "720px",
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                      gap: "10px",
                    }}
                  >
                    {[
                      "Doanh thu tiền vé theo từng tháng năm 2026?",
                      "Có bao nhiêu hiện vật trong bảo tàng?",
                      "Có bao nhiêu khách tham quan?",
                      "Phân tích phản hồi của khách tham quan",
                    ].map(
                      (example) => (
                        <button
                          key={
                            example
                          }
                          type="button"
                          onClick={() =>
                            handleExample(
                              example
                            )
                          }
                          style={{
                            padding:
                              "13px 14px",
                            border:
                              "1px solid #e2e8f0",
                            borderRadius:
                              "10px",
                            background:
                              "#ffffff",
                            color:
                              "#475569",
                            textAlign:
                              "left",
                            lineHeight:
                              1.5,
                            fontSize:
                              "13px",
                            cursor:
                              "pointer",
                          }}
                        >
                          {example}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* MESSAGES */}

            {messages.map(
              (message) => (
                <MessageBubble
                  key={
                    message.id
                  }
                  message={
                    message
                  }
                  onCopy={
                    handleCopy
                  }
                />
              )
            )}

            {/* LOADING */}

            {loading && (
              <div
                style={{
                  display:
                    "flex",
                  gap: "12px",
                  alignItems:
                    "flex-start",
                  marginBottom:
                    "28px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth:
                      "32px",
                    borderRadius:
                      "50%",
                    background:
                      "#111827",
                    color:
                      "#ffffff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <Bot size={17} />
                </div>

                <div
                  style={{
                    paddingTop:
                      "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                      color:
                        "#334155",
                      marginBottom:
                        "8px",
                    }}
                  >
                    MuseumAI
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "5px",
                    }}
                  >
                    <span
                      className="museumai-dot"
                    />
                    <span
                      className="museumai-dot"
                    />
                    <span
                      className="museumai-dot"
                    />
                  </div>
                </div>
              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div
            style={{
              padding:
                "0 clamp(12px, 3vw, 24px) 10px",
            }}
          >
            <div
              style={{
                width:
                  "100%",
                maxWidth:
                  "900px",
                margin:
                  "0 auto",
                padding:
                  "10px 14px",
                border:
                  "1px solid #fecaca",
                borderRadius:
                  "9px",
                background:
                  "#fef2f2",
                color:
                  "#b91c1c",
                fontSize:
                  "13px",
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* ====================================================
            INPUT
        ==================================================== */}

        <div
          style={{
            padding:
              "12px clamp(12px, 3vw, 24px) max(12px, env(safe-area-inset-bottom))",
            background:
              "#ffffff",
          }}
        >
          <form
            onSubmit={
              handleSubmit
            }
            style={{
              width:
                "100%",
              maxWidth:
                "900px",
              margin:
                "0 auto",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "flex-end",
                gap: "8px",
                border:
                  "1px solid #cbd5e1",
                borderRadius:
                  "14px",
                background:
                  "#ffffff",
                padding:
                  "8px 8px 8px 14px",
                boxShadow:
                  "0 2px 8px rgba(15, 23, 42, 0.06)",
              }}
            >
              <textarea
                ref={inputRef}
                value={
                  question
                }
                onChange={(event) =>
                  setQuestion(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={
                  loading
                }
                rows={1}
                placeholder="Nhập câu hỏi cho MuseumAI..."
                style={{
                  flex: 1,
                  minWidth:
                    "0",
                  resize:
                    "none",
                  border:
                    "none",
                  outline:
                    "none",
                  background:
                    "transparent",
                  color:
                    "#1e293b",
                  fontSize:
                    "14px",
                  lineHeight:
                    "1.5",
                  padding:
                    "7px 0",
                  maxHeight:
                    "120px",
                }}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !question.trim()
                }
                style={{
                  width: "38px",
                  height: "38px",
                  minWidth:
                    "38px",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    "#111827",
                  color:
                    "#ffffff",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor:
                    loading ||
                    !question.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading ||
                    !question.trim()
                      ? 0.4
                      : 1,
                }}
                title="Gửi"
              >
                <Send
                  size={17}
                />
              </button>
            </div>

            <div
              style={{
                marginTop:
                  "8px",
                textAlign:
                  "center",
                fontSize:
                  "10px",
                color:
                  "#94a3b8",
              }}
            >
              Enter để gửi ·
              Shift + Enter để
              xuống dòng
            </div>
          </form>
        </div>
      </main>

      <style>
        {`
          .museumai-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #64748b;
            animation: museumai-bounce 1.2s infinite ease-in-out;
          }

          .museumai-dot:nth-child(2) {
            animation-delay: 0.15s;
          }

          .museumai-dot:nth-child(3) {
            animation-delay: 0.3s;
          }

          @keyframes museumai-bounce {
            0%,
            60%,
            100% {
              transform: translateY(0);
              opacity: 0.45;
            }

            30% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }

          @media (max-width: 900px) {
            .museumai-dot {
              width: 6px;
              height: 6px;
            }

            .museumai-sidebar-open {
              width: 220px !important;
              min-width: 220px !important;
            }
          }

          @media (max-width: 700px) {
            .museumai-sidebar-open {
              position: absolute;
              z-index: 20;
              top: 0;
              bottom: 0;
              left: 0;
              width: min(280px, 82vw) !important;
              min-width: min(280px, 82vw) !important;
              box-shadow:
                8px 0 24px rgba(15, 23, 42, 0.12);
            }

            .museumai-sidebar-closed {
              width: 0 !important;
              min-width: 0 !important;
            }

            .museumai-sidebar-open + main {
              width: 100%;
            }
          }

          @media (max-width: 520px) {
            .museumai-sidebar-open {
              width: min(300px, 88vw) !important;
              min-width: min(300px, 88vw) !important;
            }

            .museumai-sidebar-open + main header {
              padding-left: 10px !important;
              padding-right: 10px !important;
            }

            .museumai-sidebar-open + main header > div:last-child {
              display: none;
            }

            textarea {
              font-size: 13px !important;
            }
          }

          @media (max-height: 700px) {
            .museumai-sidebar-open > div:first-child {
              padding: 8px !important;
            }

            .museumai-sidebar-open > div:last-child {
              padding: 8px !important;
            }
          }

          @media (max-width: 700px) and (max-height: 700px) {
            .museumai-sidebar-open {
              width: min(270px, 84vw) !important;
              min-width: min(270px, 84vw) !important;
            }
          }
        `}
      </style>
    </div>
  );
}