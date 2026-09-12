import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit3,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_FORM = {
  visitor_id: "",
  exhibition_id: "",
  rating: 5,
  content: "",
  status: "new",
  is_active: true,
};

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getAuthHeaders() {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Dữ liệu không hợp lệ")
      .join(", ");
  }

  return fallback;
}

function getStatusLabel(value) {
  const labels = {
    new: "Mới",
    reviewed: "Đã xem xét",
    processed: "Đã xử lý",
  };

  return labels[value] || value;
}

function getStatusClass(value) {
  if (value === "new") {
    return "feedback-status new";
  }

  if (value === "reviewed") {
    return "feedback-status reviewed";
  }

  if (value === "processed") {
    return "feedback-status processed";
  }

  return "feedback-status";
}

function renderStars(rating) {
  return "★".repeat(Number(rating) || 0);
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const filteredFeedbacks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return feedbacks.filter((feedback) => {
      const matchesSearch =
        !keyword ||
        feedback.feedback_code
          ?.toLowerCase()
          .includes(keyword) ||
        feedback.content
          ?.toLowerCase()
          .includes(keyword) ||
        feedback.visitor_name
          ?.toLowerCase()
          .includes(keyword) ||
        feedback.exhibition_name
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        !statusFilter ||
        feedback.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [feedbacks, search, statusFilter]);

  async function loadFeedbacks() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/feedback`,
        {
          params: {
            include_inactive: showInactive,
          },
          headers: getAuthHeaders(),
        },
      );

      setFeedbacks(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách phản hồi.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadReferences() {
    setLoadingReferences(true);

    try {
      const [visitorsResponse, exhibitionsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/visitors`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_URL}/api/exhibitions`, {
            headers: getAuthHeaders(),
          }),
        ]);

      setVisitors(visitorsResponse.data);
      setExhibitions(exhibitionsResponse.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải dữ liệu khách tham quan và triển lãm.",
        ),
      );
    } finally {
      setLoadingReferences(false);
    }
  }

  useEffect(() => {
    loadFeedbacks();
  }, [showInactive]);

  useEffect(() => {
    loadReferences();
  }, []);

  function openCreateModal() {
    setEditingFeedback(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(feedback) {
    setEditingFeedback(feedback);

    setForm({
      visitor_id:
        feedback.visitor_id != null
          ? String(feedback.visitor_id)
          : "",
      exhibition_id:
        feedback.exhibition_id != null
          ? String(feedback.exhibition_id)
          : "",
      rating: feedback.rating ?? 5,
      content: feedback.content || "",
      status: feedback.status || "new",
      is_active: feedback.is_active ?? true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingFeedback(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.content.trim()) {
      setError("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingFeedback) {
        const payload = {
          rating: Number(form.rating),
          content: form.content.trim(),
          status: form.status,
          is_active: form.is_active,
        };

        await axios.put(
          `${API_URL}/api/feedback/${editingFeedback.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Cập nhật phản hồi thành công.");
      } else {
        const payload = {
          rating: Number(form.rating),
          content: form.content.trim(),
          visitor_id: form.visitor_id
            ? Number(form.visitor_id)
            : null,
          exhibition_id: form.exhibition_id
            ? Number(form.exhibition_id)
            : null,
        };

        await axios.post(
          `${API_URL}/api/feedback`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Thêm phản hồi thành công.");
      }

      await loadFeedbacks();

      setShowModal(false);
      setEditingFeedback(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingFeedback
            ? "Không thể cập nhật phản hồi."
            : "Không thể thêm phản hồi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(feedback) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phản hồi "${feedback.feedback_code}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/feedback/${feedback.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (showInactive) {
        await loadFeedbacks();
      } else {
        setFeedbacks((current) =>
          current.filter(
            (item) => item.id !== feedback.id,
          ),
        );
      }

      setSuccess("Đã xóa phản hồi.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể xóa phản hồi.",
        ),
      );
    }
  }

  return (
    <div className="feedback-page">
      <style>{`
        .feedback-page {
          width: 100%;
        }

        .feedback-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .feedback-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .feedback-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .feedback-primary-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 9px;
          background: #111827;
          color: white;
          padding: 10px 15px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .feedback-primary-button:hover {
          background: #1f2937;
        }

        .feedback-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          margin-bottom: 18px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .feedback-toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .feedback-search {
          position: relative;
          flex: 1;
          max-width: 520px;
        }

        .feedback-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .feedback-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 12px 10px 40px;
          outline: none;
          font-size: 14px;
          color: #111827;
        }

        .feedback-search input:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
        }

        .feedback-status-filter {
          min-width: 150px;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 11px;
          background: white;
          color: #374151;
          outline: none;
          font-size: 14px;
        }

        .feedback-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .feedback-toolbar-right label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .feedback-alert {
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
        }

        .feedback-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .feedback-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .feedback-table-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .feedback-count {
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }

        .feedback-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .feedback-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .feedback-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .feedback-table td {
          padding: 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          vertical-align: middle;
        }

        .feedback-table tbody tr:hover {
          background: #fafafa;
        }

        .feedback-code {
          font-family: monospace;
          font-size: 13px;
          color: #4b5563;
          white-space: nowrap;
        }

        .feedback-content {
          max-width: 340px;
          line-height: 1.5;
          color: #374151;
        }

        .feedback-person {
          font-weight: 600;
          color: #111827;
        }

        .feedback-exhibition {
          color: #4b5563;
          max-width: 210px;
        }

        .feedback-rating {
          white-space: nowrap;
          color: #d97706;
          letter-spacing: 1px;
          font-size: 14px;
        }

        .feedback-rating-number {
          margin-left: 5px;
          color: #6b7280;
          letter-spacing: 0;
          font-size: 12px;
        }

        .feedback-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
          white-space: nowrap;
        }

        .feedback-status.new {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .feedback-status.reviewed {
          background: #fef3c7;
          color: #b45309;
        }

        .feedback-status.processed {
          background: #dcfce7;
          color: #15803d;
        }

        .feedback-inactive {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
          white-space: nowrap;
        }

        .feedback-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .feedback-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #4b5563;
          cursor: pointer;
        }

        .feedback-action-button:hover {
          background: #f9fafb;
        }

        .feedback-action-button.delete:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .feedback-loading,
        .feedback-empty {
          padding: 55px 20px;
          text-align: center;
          color: #6b7280;
        }

        .feedback-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .feedback-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.48);
        }

        .feedback-modal {
          width: min(700px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .feedback-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .feedback-modal-header h3 {
          margin: 0;
          font-size: 19px;
          color: #111827;
        }

        .feedback-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
        }

        .feedback-close:hover {
          background: #f3f4f6;
        }

        .feedback-form {
          padding: 22px;
        }

        .feedback-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .feedback-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .feedback-form-group.full {
          grid-column: 1 / -1;
        }

        .feedback-form-group label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .feedback-form-group input,
        .feedback-form-group select,
        .feedback-form-group textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          color: #111827;
          background: white;
          font-size: 14px;
          font-family: inherit;
        }

        .feedback-form-group textarea {
          min-height: 130px;
          resize: vertical;
        }

        .feedback-form-group input:focus,
        .feedback-form-group select:focus,
        .feedback-form-group textarea:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .feedback-rating-select {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feedback-rating-select select {
          max-width: 110px;
        }

        .feedback-form-note {
          padding: 11px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: #fafafa;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .feedback-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .feedback-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .feedback-secondary-button,
        .feedback-save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 100px;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .feedback-secondary-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .feedback-save-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .feedback-save-button:disabled,
        .feedback-secondary-button:disabled,
        .feedback-close:disabled,
        .feedback-primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 800px) {
          .feedback-header,
          .feedback-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .feedback-toolbar-left {
            flex-direction: column;
            align-items: stretch;
          }

          .feedback-search {
            max-width: none;
          }

          .feedback-status-filter {
            width: 100%;
          }

          .feedback-toolbar-right {
            justify-content: space-between;
          }

          .feedback-primary-button {
            justify-content: center;
          }

          .feedback-form-grid {
            grid-template-columns: 1fr;
          }

          .feedback-form-group.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="feedback-header">
        <div>
          <h2>Quản lý phản hồi</h2>

          <p>
            Quản lý đánh giá và phản hồi của khách tham quan
            về các cuộc triển lãm.
          </p>
        </div>

        <button
          type="button"
          className="feedback-primary-button"
          onClick={openCreateModal}
          disabled={loadingReferences}
        >
          <Plus size={18} />
          Thêm phản hồi
        </button>
      </div>

      {error && (
        <div className="feedback-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="feedback-alert success">
          {success}
        </div>
      )}

      <div className="feedback-toolbar">
        <div className="feedback-toolbar-left">
          <div className="feedback-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm theo mã, nội dung, khách hoặc triển lãm..."
            />
          </div>

          <select
            className="feedback-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Lọc trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="reviewed">Đã xem xét</option>
            <option value="processed">Đã xử lý</option>
          </select>
        </div>

        <div className="feedback-toolbar-right">
          <label>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) =>
                setShowInactive(event.target.checked)
              }
            />

            Hiện cả dữ liệu không hoạt động
          </label>
        </div>
      </div>

      <div className="feedback-table-card">
        <div className="feedback-count">
          Hiển thị{" "}
          <strong>{filteredFeedbacks.length}</strong>{" "}
          phản hồi
        </div>

        {loading ? (
          <div className="feedback-loading">
            <Loader2 size={20} />
            Đang tải danh sách phản hồi...
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="feedback-empty">
            <MessageSquare
              size={40}
              strokeWidth={1.4}
            />

            <p>
              Không có phản hồi phù hợp.
            </p>
          </div>
        ) : (
          <div className="feedback-table-wrapper">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Mã phản hồi</th>
                  <th>Khách tham quan</th>
                  <th>Triển lãm</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredFeedbacks.map((feedback) => (
                  <tr key={feedback.id}>
                    <td>
                      <span className="feedback-code">
                        {feedback.feedback_code}
                      </span>
                    </td>

                    <td>
                      <span className="feedback-person">
                        {feedback.visitor_name || "Khách ẩn danh"}
                      </span>
                    </td>

                    <td>
                      <span className="feedback-exhibition">
                        {feedback.exhibition_name || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="feedback-rating">
                        {renderStars(feedback.rating)}

                        <span className="feedback-rating-number">
                          ({feedback.rating}/5)
                        </span>
                      </span>
                    </td>

                    <td>
                      <div className="feedback-content">
                        {feedback.content}
                      </div>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          feedback.status,
                        )}
                      >
                        {getStatusLabel(feedback.status)}
                      </span>
                    </td>

                    <td>
                      {feedback.is_active ? (
                        <span className="feedback-status processed">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="feedback-inactive">
                          Không hoạt động
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="feedback-actions">
                        <button
                          type="button"
                          className="feedback-action-button"
                          onClick={() =>
                            openEditModal(feedback)
                          }
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </button>

                        {feedback.is_active && (
                          <button
                            type="button"
                            className="feedback-action-button delete"
                            onClick={() =>
                              handleDelete(feedback)
                            }
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="feedback-modal-overlay">
          <div
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
          >
            <div className="feedback-modal-header">
              <h3 id="feedback-modal-title">
                {editingFeedback
                  ? "Chỉnh sửa phản hồi"
                  : "Thêm phản hồi"}
              </h3>

              <button
                type="button"
                className="feedback-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="feedback-form"
              onSubmit={handleSubmit}
            >
              <div className="feedback-form-grid">
                {!editingFeedback && (
                  <>
                    <div className="feedback-form-group">
                      <label htmlFor="visitor_id">
                        Khách tham quan
                      </label>

                      <select
                        id="visitor_id"
                        name="visitor_id"
                        value={form.visitor_id}
                        onChange={handleChange}
                      >
                        <option value="">
                          Không gắn khách tham quan
                        </option>

                        {visitors.map((visitor) => (
                          <option
                            key={visitor.id}
                            value={visitor.id}
                          >
                            {visitor.visitor_code} —{" "}
                            {visitor.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="feedback-form-group">
                      <label htmlFor="exhibition_id">
                        Triển lãm
                      </label>

                      <select
                        id="exhibition_id"
                        name="exhibition_id"
                        value={form.exhibition_id}
                        onChange={handleChange}
                      >
                        <option value="">
                          Không gắn triển lãm
                        </option>

                        {exhibitions.map((exhibition) => (
                          <option
                            key={exhibition.id}
                            value={exhibition.id}
                          >
                            {exhibition.code} —{" "}
                            {exhibition.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="feedback-form-group">
                  <label htmlFor="rating">
                    Đánh giá
                  </label>

                  <div className="feedback-rating-select">
                    <select
                      id="rating"
                      name="rating"
                      value={form.rating}
                      onChange={handleChange}
                    >
                      <option value={1}>1 / 5</option>
                      <option value={2}>2 / 5</option>
                      <option value={3}>3 / 5</option>
                      <option value={4}>4 / 5</option>
                      <option value={5}>5 / 5</option>
                    </select>
                  </div>
                </div>

                {editingFeedback && (
                  <div className="feedback-form-group">
                    <label htmlFor="status">
                      Trạng thái
                    </label>

                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="new">Mới</option>
                      <option value="reviewed">
                        Đã xem xét
                      </option>
                      <option value="processed">
                        Đã xử lý
                      </option>
                    </select>
                  </div>
                )}

                <div className="feedback-form-group full">
                  <label htmlFor="content">
                    Nội dung phản hồi *
                  </label>

                  <textarea
                    id="content"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Nhập nội dung phản hồi..."
                    maxLength={5000}
                    required
                  />
                </div>

                {!editingFeedback && (
                  <div className="feedback-form-group full">
                    <div className="feedback-form-note">
                      Phản hồi mới sẽ được tạo với trạng thái
                      <strong> Mới</strong>. Sau khi nhân viên
                      xem xét, trạng thái có thể được cập nhật
                      trong chức năng chỉnh sửa.
                    </div>
                  </div>
                )}

                {editingFeedback && (
                  <div className="feedback-form-group full">
                    <label className="feedback-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />

                      Phản hồi đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="feedback-form-footer">
                <button
                  type="button"
                  className="feedback-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="feedback-save-button"
                  disabled={saving}
                >
                  {saving && <Loader2 size={16} />}

                  {saving
                    ? "Đang lưu..."
                    : editingFeedback
                      ? "Lưu thay đổi"
                      : "Thêm phản hồi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}