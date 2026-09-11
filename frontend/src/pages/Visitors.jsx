import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit3,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const EMPTY_FORM = {
  visitor_code: "",
  full_name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
  create_account: false,
  username: "",
  password: "",
};

const EMPTY_ACCOUNT_FORM = {
  username: "",
  password: "",
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

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [editingVisitor, setEditingVisitor] = useState(null);
  const [accountVisitor, setAccountVisitor] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [accountForm, setAccountForm] =
    useState(EMPTY_ACCOUNT_FORM);

  const filteredVisitors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return visitors;
    }

    return visitors.filter((visitor) => {
      return (
        visitor.visitor_code
          ?.toLowerCase()
          .includes(keyword) ||
        visitor.full_name
          ?.toLowerCase()
          .includes(keyword) ||
        visitor.email
          ?.toLowerCase()
          .includes(keyword) ||
        visitor.phone
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [visitors, search]);

  async function loadVisitors() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/visitors`,
        {
          params: {
            include_inactive: showInactive,
          },
          headers: getAuthHeaders(),
        },
      );

      setVisitors(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách khách tham quan.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVisitors();
  }, [showInactive]);

  function openCreateModal() {
    setEditingVisitor(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(visitor) {
    setEditingVisitor(visitor);

    setForm({
      visitor_code: visitor.visitor_code || "",
      full_name: visitor.full_name || "",
      email: visitor.email || "",
      phone: visitor.phone || "",
      address: visitor.address || "",
      notes: visitor.notes || "",
      is_active: visitor.is_active ?? true,
      create_account: false,
      username: "",
      password: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openAccountModal(visitor) {
    setAccountVisitor(visitor);
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setError("");
    setSuccess("");
    setShowAccountModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingVisitor(null);
    setForm(EMPTY_FORM);
  }

  function closeAccountModal() {
    if (creatingAccount) {
      return;
    }

    setShowAccountModal(false);
    setAccountVisitor(null);
    setAccountForm(EMPTY_ACCOUNT_FORM);
  }

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function handleAccountChange(event) {
    const { name, value } = event.target;

    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!form.visitor_code.trim()) {
      return "Vui lòng nhập mã khách tham quan.";
    }

    if (!form.full_name.trim()) {
      return "Vui lòng nhập họ và tên.";
    }

    if (form.email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(form.email.trim())) {
        return "Email không đúng định dạng.";
      }
    }

    if (!editingVisitor && form.create_account) {
      if (!form.email.trim()) {
        return "Email là bắt buộc khi tạo tài khoản.";
      }

      if (!form.username.trim()) {
        return "Vui lòng nhập tên đăng nhập.";
      }

      if (form.username.trim().length < 3) {
        return "Tên đăng nhập phải có ít nhất 3 ký tự.";
      }

      if (!form.password) {
        return "Vui lòng nhập mật khẩu.";
      }

      if (form.password.length < 8) {
        return "Mật khẩu phải có ít nhất 8 ký tự.";
      }
    }

    return "";
  }

  function validateAccountForm() {
    if (!accountForm.username.trim()) {
      return "Vui lòng nhập tên đăng nhập.";
    }

    if (accountForm.username.trim().length < 3) {
      return "Tên đăng nhập phải có ít nhất 3 ký tự.";
    }

    if (!accountForm.password) {
      return "Vui lòng nhập mật khẩu.";
    }

    if (accountForm.password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    }

    if (!accountVisitor?.email?.trim()) {
      return (
        "Khách tham quan chưa có email. " +
        "Vui lòng cập nhật email trước."
      );
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      visitor_code: form.visitor_code.trim(),
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (editingVisitor) {
        payload.is_active = form.is_active;

        await axios.put(
          `${API_URL}/api/visitors/${editingVisitor.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess(
          "Cập nhật khách tham quan thành công.",
        );
      } else {
        if (form.create_account) {
          payload.create_account = true;
          payload.username =
            form.username.trim();
          payload.password = form.password;
        }

        await axios.post(
          `${API_URL}/api/visitors`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess(
          form.create_account
            ? "Thêm khách tham quan và tạo tài khoản thành công."
            : "Thêm khách tham quan thành công.",
        );
      }

      await loadVisitors();

      setShowModal(false);
      setEditingVisitor(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingVisitor
            ? "Không thể cập nhật khách tham quan."
            : "Không thể thêm khách tham quan.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();

    const validationError =
      validateAccountForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setCreatingAccount(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${API_URL}/api/visitors/${accountVisitor.id}/account`,
        {
          username:
            accountForm.username.trim(),
          password: accountForm.password,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setSuccess(
        `Đã tạo tài khoản cho ${accountVisitor.full_name}.`,
      );

      await loadVisitors();

      setShowAccountModal(false);
      setAccountVisitor(null);
      setAccountForm(EMPTY_ACCOUNT_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tạo tài khoản cho khách tham quan.",
        ),
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  async function handleDelete(visitor) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khách tham quan "${visitor.full_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/visitors/${visitor.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setVisitors((current) =>
        current.filter(
          (item) => item.id !== visitor.id,
        ),
      );

      setSuccess(
        "Đã ngừng hoạt động khách tham quan.",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể ngừng hoạt động khách tham quan.",
        ),
      );
    }
  }

  return (
    <div className="visitors-page">
      <style>{`
        .visitors-page {
          width: 100%;
        }

        .visitors-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .visitors-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .visitors-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .visitors-primary-button {
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

        .visitors-primary-button:hover {
          background: #1f2937;
        }

        .visitors-toolbar {
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

        .visitors-search {
          position: relative;
          flex: 1;
          max-width: 560px;
        }

        .visitors-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .visitors-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 12px 10px 40px;
          outline: none;
          font-size: 14px;
          color: #111827;
        }

        .visitors-search input:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
        }

        .visitors-toolbar-right {
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .visitors-toolbar-right label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .visitors-alert {
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
        }

        .visitors-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .visitors-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .visitors-table-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .visitors-count {
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }

        .visitors-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .visitors-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .visitors-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .visitors-table td {
          padding: 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          vertical-align: middle;
        }

        .visitors-table tbody tr:hover {
          background: #fafafa;
        }

        .visitor-code {
          font-family: monospace;
          font-size: 13px;
          color: #4b5563;
        }

        .visitor-name {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 600;
          color: #111827;
        }

        .visitor-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f3f4f6;
          color: #4b5563;
          flex-shrink: 0;
        }

        .visitor-contact {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4b5563;
          white-space: nowrap;
        }

        .visitor-contact svg {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .visitor-address,
        .visitor-notes {
          max-width: 230px;
          color: #6b7280;
        }

        .visitor-status,
        .visitor-account-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .visitor-status.active {
          background: #dcfce7;
          color: #15803d;
        }

        .visitor-status.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .visitor-account-status.has-account {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .visitor-account-status.no-account {
          background: #fef3c7;
          color: #92400e;
        }

        .visitor-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .visitor-action-button {
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

        .visitor-action-button:hover {
          background: #f9fafb;
        }

        .visitor-action-button.account:hover {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .visitor-action-button.delete:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .visitors-empty,
        .visitors-loading {
          padding: 55px 20px;
          text-align: center;
          color: #6b7280;
        }

        .visitors-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .visitor-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.48);
        }

        .visitor-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .visitor-account-modal {
          width: min(520px, 100%);
        }

        .visitor-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .visitor-modal-header h3 {
          margin: 0;
          font-size: 19px;
          color: #111827;
        }

        .visitor-close {
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

        .visitor-close:hover {
          background: #f3f4f6;
        }

        .visitor-form {
          padding: 22px;
        }

        .visitor-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .visitor-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .visitor-form-group.full {
          grid-column: 1 / -1;
        }

        .visitor-form-group label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .visitor-form-group input,
        .visitor-form-group textarea {
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

        .visitor-form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .visitor-form-group input:focus,
        .visitor-form-group textarea:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .visitor-form-group input::placeholder,
        .visitor-form-group textarea::placeholder {
          color: #9ca3af;
        }

        .visitor-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .visitor-account-section {
          grid-column: 1 / -1;
          padding: 16px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #f8fbff;
        }

        .visitor-account-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          color: #1e40af;
          font-size: 14px;
          font-weight: 700;
        }

        .visitor-account-help {
          margin: 0 0 14px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .visitor-account-info {
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 8px;
          background: #f9fafb;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.5;
        }

        .visitor-account-info strong {
          color: #111827;
        }

        .visitor-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .visitor-secondary-button,
        .visitor-save-button {
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

        .visitor-secondary-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .visitor-save-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .visitor-secondary-button:disabled,
        .visitor-save-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .visitors-header,
          .visitors-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .visitors-primary-button {
            justify-content: center;
          }

          .visitors-toolbar-right {
            white-space: normal;
          }

          .visitor-form-grid {
            grid-template-columns: 1fr;
          }

          .visitor-form-group.full,
          .visitor-account-section {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="visitors-header">
        <div>
          <h2>Khách tham quan</h2>

          <p>
            Quản lý thông tin khách tham quan của
            bảo tàng.
          </p>
        </div>

        <button
          type="button"
          className="visitors-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Thêm khách tham quan
        </button>
      </div>

      {error && (
        <div className="visitors-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="visitors-alert success">
          {success}
        </div>
      )}

      <div className="visitors-toolbar">
        <div className="visitors-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã, tên, email hoặc số điện thoại..."
          />
        </div>

        <div className="visitors-toolbar-right">
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

      <div className="visitors-table-card">
        <div className="visitors-count">
          Hiển thị{" "}
          <strong>
            {filteredVisitors.length}
          </strong>{" "}
          khách tham quan
        </div>

        {loading ? (
          <div className="visitors-loading">
            <Loader2 size={20} />
            Đang tải danh sách khách tham quan...
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="visitors-empty">
            <User
              size={40}
              strokeWidth={1.4}
            />

            <p>
              Không có khách tham quan phù hợp.
            </p>
          </div>
        ) : (
          <div className="visitors-table-wrapper">
            <table className="visitors-table">
              <thead>
                <tr>
                  <th>Mã khách</th>
                  <th>Khách tham quan</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Địa chỉ</th>
                  <th>Ghi chú</th>
                  <th>Tài khoản</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id}>
                    <td>
                      <span className="visitor-code">
                        {visitor.visitor_code}
                      </span>
                    </td>

                    <td>
                      <div className="visitor-name">
                        <span className="visitor-avatar">
                          <User size={16} />
                        </span>

                        {visitor.full_name}
                      </div>
                    </td>

                    <td>
                      {visitor.email ? (
                        <span className="visitor-contact">
                          <Mail size={14} />
                          {visitor.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      {visitor.phone ? (
                        <span className="visitor-contact">
                          <Phone size={14} />
                          {visitor.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <div className="visitor-address">
                        {visitor.address || "—"}
                      </div>
                    </td>

                    <td>
                      <div className="visitor-notes">
                        {visitor.notes || "—"}
                      </div>
                    </td>

                    <td>
                      {visitor.user_id ? (
                        <span className="visitor-account-status has-account">
                          Đã có tài khoản
                        </span>
                      ) : (
                        <span className="visitor-account-status no-account">
                          Chưa có tài khoản
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`visitor-status ${
                          visitor.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {visitor.is_active
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td>

                    <td>
                      <div className="visitor-actions">
                        {!visitor.user_id &&
                          visitor.is_active && (
                            <button
                              type="button"
                              className="visitor-action-button account"
                              onClick={() =>
                                openAccountModal(visitor)
                              }
                              title="Tạo tài khoản"
                            >
                              <KeyRound size={16} />
                            </button>
                          )}

                        <button
                          type="button"
                          className="visitor-action-button"
                          onClick={() =>
                            openEditModal(visitor)
                          }
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="visitor-action-button delete"
                          onClick={() =>
                            handleDelete(visitor)
                          }
                          title="Ngừng hoạt động"
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
        <div className="visitor-modal-overlay">
          <div
            className="visitor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-modal-title"
          >
            <div className="visitor-modal-header">
              <h3 id="visitor-modal-title">
                {editingVisitor
                  ? "Chỉnh sửa khách tham quan"
                  : "Thêm khách tham quan"}
              </h3>

              <button
                type="button"
                className="visitor-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="visitor-form"
              onSubmit={handleSubmit}
            >
              <div className="visitor-form-grid">
                <div className="visitor-form-group">
                  <label htmlFor="visitor-code">
                    Mã khách *
                  </label>

                  <input
                    id="visitor-code"
                    name="visitor_code"
                    value={form.visitor_code}
                    onChange={handleChange}
                    placeholder="VD: KH001"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="visitor-form-group">
                  <label htmlFor="visitor-name">
                    Họ và tên *
                  </label>

                  <input
                    id="visitor-name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="visitor-form-group">
                  <label htmlFor="visitor-email">
                    Email
                  </label>

                  <input
                    id="visitor-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    maxLength={255}
                  />
                </div>

                <div className="visitor-form-group">
                  <label htmlFor="visitor-phone">
                    Số điện thoại
                  </label>

                  <input
                    id="visitor-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                    maxLength={30}
                  />
                </div>

                <div className="visitor-form-group full">
                  <label htmlFor="visitor-address">
                    Địa chỉ
                  </label>

                  <div style={{ position: "relative" }}>
                    <MapPin
                      size={15}
                      style={{
                        position: "absolute",
                        left: "11px",
                        top: "12px",
                        color: "#9ca3af",
                      }}
                    />

                    <input
                      id="visitor-address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Địa chỉ của khách tham quan"
                      maxLength={500}
                      style={{
                        paddingLeft: "34px",
                      }}
                    />
                  </div>
                </div>

                <div className="visitor-form-group full">
                  <label htmlFor="visitor-notes">
                    Ghi chú
                  </label>

                  <textarea
                    id="visitor-notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Thông tin bổ sung..."
                    maxLength={1000}
                  />
                </div>

                {!editingVisitor && (
                  <div className="visitor-account-section">
                    <label className="visitor-checkbox">
                      <input
                        type="checkbox"
                        name="create_account"
                        checked={form.create_account}
                        onChange={handleChange}
                      />

                      <KeyRound size={16} />

                      Tạo tài khoản đăng nhập cho khách
                    </label>

                    {form.create_account && (
                      <div
                        className="visitor-form-grid"
                        style={{
                          marginTop: "14px",
                        }}
                      >
                        <div className="visitor-form-group">
                          <label htmlFor="visitor-username">
                            Tên đăng nhập *
                          </label>

                          <input
                            id="visitor-username"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="VD: nguyenvana"
                            minLength={3}
                            maxLength={50}
                            autoComplete="username"
                          />
                        </div>

                        <div className="visitor-form-group">
                          <label htmlFor="visitor-password">
                            Mật khẩu *
                          </label>

                          <input
                            id="visitor-password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Tối thiểu 8 ký tự"
                            minLength={8}
                            maxLength={128}
                            autoComplete="new-password"
                          />
                        </div>

                        <p
                          className="visitor-account-help"
                          style={{
                            gridColumn: "1 / -1",
                          }}
                        >
                          Tài khoản được tạo với quyền
                          <strong> visitor</strong>. Tài khoản
                          này không được phép truy cập khu vực
                          quản lý bảo tàng.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {editingVisitor && (
                  <div className="visitor-form-group full">
                    <label className="visitor-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />

                      Khách tham quan đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="visitor-form-footer">
                <button
                  type="button"
                  className="visitor-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="visitor-save-button"
                  disabled={saving}
                >
                  {saving && (
                    <Loader2 size={16} />
                  )}

                  {saving
                    ? "Đang lưu..."
                    : editingVisitor
                      ? "Lưu thay đổi"
                      : "Thêm khách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountModal && accountVisitor && (
        <div className="visitor-modal-overlay">
          <div
            className="visitor-modal visitor-account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visitor-account-modal-title"
          >
            <div className="visitor-modal-header">
              <h3 id="visitor-account-modal-title">
                Tạo tài khoản khách tham quan
              </h3>

              <button
                type="button"
                className="visitor-close"
                onClick={closeAccountModal}
                disabled={creatingAccount}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="visitor-form"
              onSubmit={handleCreateAccount}
            >
              <div className="visitor-account-info">
                <div>
                  <strong>Khách tham quan:</strong>{" "}
                  {accountVisitor.full_name}
                </div>

                <div>
                  <strong>Email:</strong>{" "}
                  {accountVisitor.email || "Chưa có email"}
                </div>
              </div>

              <div className="visitor-form-grid">
                <div className="visitor-form-group full">
                  <label htmlFor="account-username">
                    Tên đăng nhập *
                  </label>

                  <input
                    id="account-username"
                    name="username"
                    value={accountForm.username}
                    onChange={handleAccountChange}
                    placeholder="VD: nguyenvana"
                    minLength={3}
                    maxLength={50}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="visitor-form-group full">
                  <label htmlFor="account-password">
                    Mật khẩu *
                  </label>

                  <input
                    id="account-password"
                    name="password"
                    type="password"
                    value={accountForm.password}
                    onChange={handleAccountChange}
                    placeholder="Tối thiểu 8 ký tự"
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="visitor-form-footer">
                <button
                  type="button"
                  className="visitor-secondary-button"
                  onClick={closeAccountModal}
                  disabled={creatingAccount}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="visitor-save-button"
                  disabled={creatingAccount}
                >
                  {creatingAccount && (
                    <Loader2 size={16} />
                  )}

                  {creatingAccount
                    ? "Đang tạo..."
                    : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}