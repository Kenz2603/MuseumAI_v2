import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit3,
  Loader2,
  Map,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  location: "",
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

export default function ExhibitionAreas() {
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const filteredAreas = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return areas;
    }

    return areas.filter((area) => {
      return (
        area.code?.toLowerCase().includes(keyword) ||
        area.name?.toLowerCase().includes(keyword) ||
        area.location?.toLowerCase().includes(keyword)
      );
    });
  }, [areas, search]);

  async function loadAreas() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/exhibition-areas`,
        {
          params: {
            include_inactive: showInactive,
          },
          headers: getAuthHeaders(),
        },
      );

      setAreas(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách khu vực trưng bày.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAreas();
  }, [showInactive]);

  function openCreateModal() {
    setEditingArea(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(area) {
    setEditingArea(area);

    setForm({
      code: area.code || "",
      name: area.name || "",
      description: area.description || "",
      location: area.location || "",
      is_active: area.is_active ?? true,
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
    setEditingArea(null);
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

    if (!form.code.trim()) {
      setError("Vui lòng nhập mã khu vực.");
      return;
    }

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên khu vực.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
    };

    try {
      if (editingArea) {
        payload.is_active = form.is_active;

        await axios.put(
          `${API_URL}/api/exhibition-areas/${editingArea.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Cập nhật khu vực thành công.");
      } else {
        await axios.post(
          `${API_URL}/api/exhibition-areas`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Thêm khu vực thành công.");
      }

      await loadAreas();

      setShowModal(false);
      setEditingArea(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingArea
            ? "Không thể cập nhật khu vực."
            : "Không thể thêm khu vực.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(area) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khu vực "${area.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/exhibition-areas/${area.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setAreas((current) =>
        current.filter(
          (item) => item.id !== area.id,
        ),
      );

      setSuccess("Đã xóa khu vực.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể xóa khu vực.",
        ),
      );
    }
  }

  return (
    <div className="exhibition-areas-page">
      <style>{`
        .exhibition-areas-page {
          width: 100%;
        }

        .areas-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .areas-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .areas-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .areas-primary-button {
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

        .areas-primary-button:hover {
          background: #1f2937;
        }

        .areas-toolbar {
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

        .areas-search {
          position: relative;
          flex: 1;
          max-width: 520px;
        }

        .areas-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .areas-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 12px 10px 40px;
          outline: none;
          font-size: 14px;
          color: #111827;
        }

        .areas-search input:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
        }

        .areas-toolbar-right {
          display: flex;
          align-items: center;
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .areas-toolbar-right label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .areas-alert {
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
        }

        .areas-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .areas-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .areas-table-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .areas-count {
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }

        .areas-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .areas-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }

        .areas-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .areas-table td {
          padding: 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          vertical-align: middle;
        }

        .areas-table tbody tr:hover {
          background: #fafafa;
        }

        .area-code {
          font-family: monospace;
          font-size: 13px;
          color: #4b5563;
        }

        .area-name {
          font-weight: 600;
          color: #111827;
        }

        .area-description {
          max-width: 360px;
          color: #6b7280;
          line-height: 1.5;
        }

        .area-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
        }

        .area-status.active {
          background: #dcfce7;
          color: #15803d;
        }

        .area-status.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .area-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .area-action-button {
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

        .area-action-button:hover {
          background: #f9fafb;
        }

        .area-action-button.delete:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .areas-empty,
        .areas-loading {
          padding: 55px 20px;
          text-align: center;
          color: #6b7280;
        }

        .areas-empty svg {
          margin-bottom: 4px;
        }

        .areas-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .area-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.48);
        }

        .area-modal {
          width: min(680px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .area-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .area-modal-header h3 {
          margin: 0;
          font-size: 19px;
          color: #111827;
        }

        .area-close {
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

        .area-close:hover {
          background: #f3f4f6;
        }

        .area-form {
          padding: 22px;
        }

        .area-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .area-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .area-form-group.full {
          grid-column: 1 / -1;
        }

        .area-form-group label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .area-form-group input,
        .area-form-group textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          color: #111827;
          font-size: 14px;
          font-family: inherit;
        }

        .area-form-group textarea {
          min-height: 120px;
          resize: vertical;
        }

        .area-form-group input:focus,
        .area-form-group textarea:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .area-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .area-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .area-secondary-button,
        .area-save-button {
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

        .area-secondary-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .area-save-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .area-secondary-button:disabled,
        .area-save-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .areas-header,
          .areas-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .areas-primary-button {
            justify-content: center;
          }

          .areas-toolbar-right {
            justify-content: space-between;
          }

          .area-form-grid {
            grid-template-columns: 1fr;
          }

          .area-form-group.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="areas-header">
        <div>
          <h2>Khu vực trưng bày</h2>

          <p>
            Quản lý các khu vực và vị trí trưng bày trong
            bảo tàng.
          </p>
        </div>

        <button
          type="button"
          className="areas-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Thêm khu vực
        </button>
      </div>

      {error && (
        <div className="areas-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="areas-alert success">
          {success}
        </div>
      )}

      <div className="areas-toolbar">
        <div className="areas-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã, tên hoặc vị trí..."
          />
        </div>

        <div className="areas-toolbar-right">
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

      <div className="areas-table-card">
        <div className="areas-count">
          Hiển thị{" "}
          <strong>{filteredAreas.length}</strong>{" "}
          khu vực
        </div>

        {loading ? (
          <div className="areas-loading">
            <Loader2 size={20} />
            Đang tải danh sách khu vực...
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="areas-empty">
            <Map size={40} strokeWidth={1.4} />

            <p>
              Không có khu vực phù hợp.
            </p>
          </div>
        ) : (
          <div className="areas-table-wrapper">
            <table className="areas-table">
              <thead>
                <tr>
                  <th>Mã khu vực</th>
                  <th>Tên khu vực</th>
                  <th>Mô tả</th>
                  <th>Vị trí</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredAreas.map((area) => (
                  <tr key={area.id}>
                    <td>
                      <span className="area-code">
                        {area.code}
                      </span>
                    </td>

                    <td>
                      <span className="area-name">
                        {area.name}
                      </span>
                    </td>

                    <td>
                      <div className="area-description">
                        {area.description || "—"}
                      </div>
                    </td>

                    <td>
                      {area.location || "—"}
                    </td>

                    <td>
                      <span
                        className={`area-status ${
                          area.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {area.is_active
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td>

                    <td>
                      <div className="area-actions">
                        <button
                          type="button"
                          className="area-action-button"
                          onClick={() =>
                            openEditModal(area)
                          }
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="area-action-button delete"
                          onClick={() =>
                            handleDelete(area)
                          }
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
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
        <div className="area-modal-overlay">
          <div
            className="area-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-modal-title"
          >
            <div className="area-modal-header">
              <h3 id="area-modal-title">
                {editingArea
                  ? "Chỉnh sửa khu vực"
                  : "Thêm khu vực"}
              </h3>

              <button
                type="button"
                className="area-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="area-form"
              onSubmit={handleSubmit}
            >
              <div className="area-form-grid">
                <div className="area-form-group">
                  <label htmlFor="area-code">
                    Mã khu vực *
                  </label>

                  <input
                    id="area-code"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="VD: KV001"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="area-form-group">
                  <label htmlFor="area-name">
                    Tên khu vực *
                  </label>

                  <input
                    id="area-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="VD: Khu trưng bày thời Nguyễn"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="area-form-group full">
                  <label htmlFor="area-location">
                    Vị trí
                  </label>

                  <input
                    id="area-location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="VD: Tầng 1 - Phòng A"
                    maxLength={255}
                  />
                </div>

                <div className="area-form-group full">
                  <label htmlFor="area-description">
                    Mô tả
                  </label>

                  <textarea
                    id="area-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả khu vực trưng bày..."
                  />
                </div>

                {editingArea && (
                  <div className="area-form-group full">
                    <label className="area-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />

                      Khu vực đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="area-form-footer">
                <button
                  type="button"
                  className="area-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="area-save-button"
                  disabled={saving}
                >
                  {saving && <Loader2 size={16} />}

                  {saving
                    ? "Đang lưu..."
                    : editingArea
                      ? "Lưu thay đổi"
                      : "Thêm khu vực"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}