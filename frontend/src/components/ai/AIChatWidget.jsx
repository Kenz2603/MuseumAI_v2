import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý AI của MuseumAI. Tôi có thể hỗ trợ bạn tra cứu thông tin hiện vật, triển lãm, khu vực trưng bày, khách tham quan, vé, phản hồi và các nghiệp vụ quản lý bảo tàng.",
};

const SUGGESTED_QUESTIONS = [
  "Bảo tàng hiện có bao nhiêu hiện vật?",
  "Có những triển lãm nào đang hoạt động?",
  "Tóm tắt tình hình quản lý khách tham quan.",
  "Có vấn đề gì nổi bật trong phản hồi của khách?",
];

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function createMessageId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open]);

  function clearConversation() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  async function sendMessage(messageText = input) {
    const message = messageText.trim();

    if (!message || loading) {
      return;
    }

    const userMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };

    const previousMessages = messages.filter(
      (item) => item.id !== "welcome",
    );

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
        );
      }

      const history = [
        ...previousMessages,
        userMessage,
      ].map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            history,
          }),
        },
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Không thể kết nối với trợ lý AI.",
        );
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.content;

      if (!answer) {
        throw new Error(
          "AI không trả về nội dung phản hồi.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content:
            error?.message ||
            "Đã xảy ra lỗi khi kết nối với AI.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

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

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý AI"
          title="Trợ lý AI MuseumAI"
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 1000,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background:
              "linear-gradient(135deg, #7c3aed, #2563eb)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow:
              "0 10px 30px rgba(37, 99, 235, 0.35)",
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform =
              "scale(1.08)";

            event.currentTarget.style.boxShadow =
              "0 14px 35px rgba(37, 99, 235, 0.45)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform =
              "scale(1)";

            event.currentTarget.style.boxShadow =
              "0 10px 30px rgba(37, 99, 235, 0.35)";
          }}
        >
          <Sparkles
            size={27}
            strokeWidth={2.2}
          />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý AI MuseumAI"
          style={{
            position: "fixed",
            right: "24px",
            bottom: "24px",
            zIndex: 1000,
            width:
              "min(420px, calc(100vw - 32px))",
            height:
              "min(620px, calc(100vh - 48px))",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#ffffff",
            border:
              "1px solid rgba(15, 23, 42, 0.10)",
            borderRadius: "20px",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.22)",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              minHeight: "72px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#ffffff",
              background:
                "linear-gradient(135deg, #6d28d9, #2563eb)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "rgba(255,255,255,0.18)",
                  border:
                    "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Bot size={23} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  Trợ lý AI MuseumAI
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "12px",
                    opacity: 0.85,
                  }}
                >
                  Hỗ trợ quản lý bảo tàng
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={clearConversation}
                title="Xóa cuộc trò chuyện"
                aria-label="Xóa cuộc trò chuyện"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  background:
                    "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng trợ lý AI"
                aria-label="Đóng trợ lý AI"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "none",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  background:
                    "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                }}
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "18px",
              background: "#f8fafc",
            }}
          >
            {messages.map((message) => {
              const isUser =
                message.role === "user";

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser
                      ? "flex-end"
                      : "flex-start",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "84%",
                      padding: "10px 13px",
                      borderRadius: isUser
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                      background: isUser
                        ? "#2563eb"
                        : "#ffffff",
                      color: isUser
                        ? "#ffffff"
                        : message.error
                          ? "#b91c1c"
                          : "#1e293b",
                      border: isUser
                        ? "none"
                        : "1px solid #e2e8f0",
                      boxShadow: isUser
                        ? "none"
                        : "0 2px 8px rgba(15,23,42,0.05)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "5px",
                          color: "#6d28d9",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        <Bot size={13} />
                        MUSEUMAI AI
                      </div>
                    )}

                    {message.content}
                  </div>
                </div>
              );
            })}

            {messages.length === 1 &&
              !loading && (
                <div
                  style={{
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "9px",
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Bạn có thể hỏi:
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {SUGGESTED_QUESTIONS.map(
                      (question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() =>
                            sendMessage(question)
                          }
                          style={{
                            padding:
                              "10px 12px",
                            textAlign: "left",
                            border:
                              "1px solid #dbeafe",
                            borderRadius: "10px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: "12px",
                            lineHeight: 1.45,
                            cursor: "pointer",
                          }}
                        >
                          {question}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 13px",
                    borderRadius:
                      "16px 16px 16px 4px",
                    background: "#ffffff",
                    border:
                      "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  <Loader2
                    size={15}
                    style={{
                      animation:
                        "museumAI-spin 1s linear infinite",
                    }}
                  />

                  AI đang suy nghĩ...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "12px",
              background: "#ffffff",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "8px",
                padding: "8px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "14px",
                background: "#ffffff",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi cho trợ lý AI..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  maxHeight: "100px",
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "#0f172a",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  padding: "5px 4px",
                  fontFamily: "inherit",
                }}
              />

              <button
                type="submit"
                disabled={
                  loading || !input.trim()
                }
                aria-label="Gửi câu hỏi"
                title="Gửi"
                style={{
                  width: "38px",
                  height: "38px",
                  flexShrink: 0,
                  border: "none",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    loading || !input.trim()
                      ? "#cbd5e1"
                      : "#2563eb",
                  color: "#ffffff",
                  cursor:
                    loading || !input.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <Send size={17} />
              </button>
            </div>

            <div
              style={{
                marginTop: "6px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "10px",
              }}
            >
              Enter để gửi · Shift + Enter để xuống dòng
            </div>
          </form>

          <style>
            {`
              @keyframes museumAI-spin {
                from {
                  transform: rotate(0deg);
                }

                to {
                  transform: rotate(360deg);
                }
              }

              @media (max-width: 640px) {
                .museum-ai-widget {
                  right: 12px;
                  bottom: 12px;
                  width: calc(100vw - 24px);
                  height: calc(100vh - 24px);
                }
              }
            `}
          </style>
        </div>
      )}
    </>
  );
}