import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  Trash2,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const TICKET_TYPES = [
  {
    value: "normal",
    label: "Vé thường",
    price: 50000,
  },
  {
    value: "student",
    label: "Vé sinh viên",
    price: 25000,
  },
  {
    value: "child",
    label: "Vé trẻ em",
    price: 10000,
  },
];

const STATUS_OPTIONS = [
  {
    value: "valid",
    label: "Hợp lệ",
  },
  {
    value: "used",
    label: "Đã sử dụng",
  },
  {
    value: "cancelled",
    label: "Đã hủy",
  },
];

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getHeaders() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (!response.ok) {
      let message = "Có lỗi xảy ra.";

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item) => item?.msg || "Dữ liệu không hợp lệ")
          .join(", ");
      }

      throw new Error(message);
    }

    return data;
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "Có lỗi xảy ra.");
  }

  return text;
}

function formatPrice(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  return `${new Intl.NumberFormat("vi-VN").format(number)} đ`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getTicketTypeLabel(value) {
  return (
    TICKET_TYPES.find((item) => item.value === value)?.label || value
  );
}

function getStatusLabel(value) {
  return (
    STATUS_OPTIONS.find((item) => item.value === value)?.label || value
  );
}

function getStatusClass(value) {
  if (value === "valid") {
    return "status-valid";
  }

  if (value === "used") {
    return "status-used";
  }

  if (value === "cancelled") {
    return "status-cancelled";
  }

  return "status-default";
}

function createEmptyForm() {
  return {
    ticket_code: "",
    visitor_id: "",
    exhibition_id: "",
    ticket_type: "normal",
    visit_date: getToday(),
    status: "valid",
    notes: "",
    is_active: true,
  };
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(createEmptyForm());

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const queryString = params.toString();

      const response = await fetch(
        `${API_BASE_URL}/api/tickets${
          queryString ? `?${queryString}` : ""
        }`,
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      const data = await parseResponse(response);

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách vé.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    setLoadingOptions(true);

    try {
      const [visitorsResponse, exhibitionsResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/api/visitors`,
            {
              method: "GET",
              headers: getHeaders(),
            },
          ),
          fetch(
            `${API_BASE_URL}/api/exhibitions`,
            {
              method: "GET",
              headers: getHeaders(),
            },
          ),
        ]);

      const [visitorsData, exhibitionsData] =
        await Promise.all([
          parseResponse(visitorsResponse),
          parseResponse(exhibitionsResponse),
        ]);

      setVisitors(
        Array.isArray(visitorsData)
          ? visitorsData
          : [],
      );

      setExhibitions(
        Array.isArray(exhibitionsData)
          ? exhibitionsData
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu khách tham quan và triển lãm.",
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  function openCreateModal() {
    setEditingTicket(null);
    setForm(createEmptyForm());
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(ticket) {
    setEditingTicket(ticket);

    setForm({
      ticket_code: ticket.ticket_code || "",
      visitor_id: String(ticket.visitor_id || ""),
      exhibition_id: String(ticket.exhibition_id || ""),
      ticket_type: ticket.ticket_type || "normal",
      visit_date: ticket.visit_date || getToday(),
      status: ticket.status || "valid",
      notes: ticket.notes || "",
      is_active: ticket.is_active !== false,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setEditingTicket(null);
    setForm(createEmptyForm());
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  const selectedTicketType = useMemo(
    () =>
      TICKET_TYPES.find(
        (item) => item.value === form.ticket_type,
      ),
    [form.ticket_type],
  );

  const selectedExhibition = useMemo(
    () =>
      exhibitions.find(
        (item) =>
          String(item.id) === String(form.exhibition_id),
      ),
    [exhibitions, form.exhibition_id],
  );

  function validateForm() {
    if (!form.ticket_code.trim()) {
      return "Vui lòng nhập mã vé.";
    }

    if (!form.visitor_id) {
      return "Vui lòng chọn khách tham quan.";
    }

    if (!form.exhibition_id) {
      return "Vui lòng chọn triển lãm.";
    }

    if (!form.ticket_type) {
      return "Vui lòng chọn loại vé.";
    }

    if (!form.visit_date) {
      return "Vui lòng chọn ngày tham quan.";
    }

    if (!form.status.trim()) {
      return "Vui lòng chọn trạng thái vé.";
    }

    if (
      selectedExhibition?.start_date &&
      selectedExhibition?.end_date
    ) {
      const visitDate = form.visit_date;
      const startDate = selectedExhibition.start_date.slice(0, 10);
      const endDate = selectedExhibition.end_date.slice(0, 10);

      if (visitDate < startDate || visitDate > endDate) {
        return (
          "Ngày tham quan phải nằm trong thời gian diễn ra triển lãm " +
          `(${formatDate(startDate)} - ${formatDate(endDate)}).`
        );
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ticket_code: form.ticket_code.trim(),
        visitor_id: Number(form.visitor_id),
        exhibition_id: Number(form.exhibition_id),
        ticket_type: form.ticket_type,
        visit_date: form.visit_date,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editingTicket) {
        payload.is_active = form.is_active;

        const response = await fetch(
          `${API_BASE_URL}/api/tickets/${editingTicket.id}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          },
        );

        await parseResponse(response);

        setSuccess("Cập nhật vé thành công.");
      } else {
        const response = await fetch(
          `${API_BASE_URL}/api/tickets`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          },
        );

        await parseResponse(response);

        setSuccess("Tạo vé thành công.");
      }

      setShowModal(false);
      setEditingTicket(null);
      setForm(createEmptyForm());

      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu thông tin vé.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ticket) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy vé "${ticket.ticket_code}" không?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${ticket.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      await parseResponse(response);

      setSuccess(
        `Đã hủy vé ${ticket.ticket_code}.`,
      );

      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể hủy vé.",
      );
    }
  }

  const visibleTickets = useMemo(() => {
    if (activeFilter === "all") {
      return tickets;
    }

    if (activeFilter === "active") {
      return tickets.filter(
        (ticket) => ticket.is_active,
      );
    }

    return tickets.filter(
      (ticket) => !ticket.is_active,
    );
  }, [tickets, activeFilter]);

  const statistics = useMemo(() => {
    const total = tickets.length;

    const valid = tickets.filter(
      (ticket) =>
        ticket.status === "valid" &&
        ticket.is_active,
    ).length;

    const used = tickets.filter(
      (ticket) => ticket.status === "used",
    ).length;

    const cancelled = tickets.filter(
      (ticket) =>
        ticket.status === "cancelled" ||
        !ticket.is_active,
    ).length;

    return {
      total,
      valid,
      used,
      cancelled,
    };
  }, [tickets]);

  return (
    <div className="tickets-page">
      <style>{`
        .tickets-page {
          width: 100%;
        }

        .tickets-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .tickets-title {
          margin: 0;
          color: #111827;
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .tickets-subtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .tickets-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 16px;
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .tickets-primary-button:hover {
          background: #1f2937;
        }

        .tickets-primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tickets-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
        }

        .tickets-alert-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .tickets-alert-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
        }

        .tickets-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .tickets-stat {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
        }

        .tickets-stat-label {
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
        }

        .tickets-stat-value {
          margin-top: 7px;
          color: #111827;
          font-size: 25px;
          font-weight: 700;
        }

        .tickets-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
        }

        .tickets-search {
          position: relative;
          flex: 1;
          min-width: 240px;
        }

        .tickets-search svg {
          position: absolute;
          top: 50%;
          left: 12px;
          width: 17px;
          height: 17px;
          color: #9ca3af;
          transform: translateY(-50%);
        }

        .tickets-search input,
        .tickets-filter,
        .tickets-form-control {
          width: 100%;
          min-height: 40px;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          outline: none;
          transition: 0.2s ease;
        }

        .tickets-search input {
          padding: 0 12px 0 38px;
        }

        .tickets-filter {
          width: 180px;
          padding: 0 11px;
        }

        .tickets-search input:focus,
        .tickets-filter:focus,
        .tickets-form-control:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .tickets-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
        }

        .tickets-refresh-button:hover {
          background: #f9fafb;
        }

        .tickets-filter-buttons {
          display: flex;
          gap: 6px;
        }

        .tickets-filter-button {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #4b5563;
          font-size: 13px;
          cursor: pointer;
        }

        .tickets-filter-button.active {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }

        .tickets-table-card {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
        }

        .tickets-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .tickets-table {
          width: 100%;
          min-width: 1180px;
          border-collapse: collapse;
        }

        .tickets-table th {
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
        }

        .tickets-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
          font-size: 13px;
          vertical-align: middle;
        }

        .tickets-table tbody tr:hover {
          background: #fafafa;
        }

        .tickets-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .tickets-code {
          color: #111827;
          font-weight: 700;
          white-space: nowrap;
        }

        .tickets-visitor-name {
          color: #111827;
          font-weight: 600;
        }

        .tickets-secondary {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 12px;
        }

        .tickets-price {
          color: #111827;
          font-weight: 700;
          white-space: nowrap;
        }

        .tickets-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 27px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-valid {
          background: #dcfce7;
          color: #166534;
        }

        .status-used {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-default {
          background: #f3f4f6;
          color: #4b5563;
        }

        .tickets-active {
          background: #dcfce7;
          color: #166534;
        }

        .tickets-inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .tickets-actions {
          display: flex;
          gap: 6px;
        }

        .tickets-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: #ffffff;
          color: #4b5563;
          cursor: pointer;
        }

        .tickets-action-button:hover {
          background: #f9fafb;
          color: #111827;
        }

        .tickets-action-delete:hover {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
        }

        .tickets-empty,
        .tickets-loading {
          padding: 50px 20px;
          color: #6b7280;
          text-align: center;
        }

        .tickets-modal-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.45);
        }

        .tickets-modal {
          width: min(760px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.2);
        }

        .tickets-modal-header {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .tickets-modal-title {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 700;
        }

        .tickets-modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 7px;
          background: #f3f4f6;
          color: #4b5563;
          cursor: pointer;
        }

        .tickets-modal-body {
          padding: 20px;
        }

        .tickets-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .tickets-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .tickets-form-group-full {
          grid-column: 1 / -1;
        }

        .tickets-form-label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .tickets-form-required {
          color: #dc2626;
        }

        .tickets-form-control {
          padding: 0 11px;
        }

        textarea.tickets-form-control {
          min-height: 100px;
          padding: 10px 11px;
          resize: vertical;
          font-family: inherit;
        }

        .tickets-price-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: #f9fafb;
        }

        .tickets-price-preview-label {
          color: #6b7280;
          font-size: 13px;
        }

        .tickets-price-preview-value {
          color: #111827;
          font-size: 15px;
          font-weight: 700;
        }

        .tickets-help {
          margin-top: 5px;
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.45;
        }

        .tickets-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          color: #374151;
          font-size: 13px;
          cursor: pointer;
        }

        .tickets-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #111827;
        }

        .tickets-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
        }

        .tickets-secondary-button {
          min-height: 40px;
          padding: 0 15px;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          background: #ffffff;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .tickets-secondary-button:hover {
          background: #f9fafb;
        }

        @media (max-width: 1000px) {
          .tickets-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .tickets-header {
            flex-direction: column;
          }

          .tickets-primary-button {
            width: 100%;
          }

          .tickets-toolbar {
            align-items: stretch;
          }

          .tickets-search {
            min-width: 100%;
          }

          .tickets-filter {
            width: 100%;
          }

          .tickets-filter-buttons {
            width: 100%;
          }

          .tickets-filter-button {
            flex: 1;
          }

          .tickets-form-grid {
            grid-template-columns: 1fr;
          }

          .tickets-form-group-full {
            grid-column: auto;
          }
        }

        @media (max-width: 520px) {
          .tickets-stats {
            grid-template-columns: 1fr;
          }

          .tickets-title {
            font-size: 24px;
          }

          .tickets-modal-backdrop {
            padding: 0;
          }

          .tickets-modal {
            width: 100%;
            max-height: 100vh;
            min-height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>

      <div className="tickets-header">
        <div>
          <h1 className="tickets-title">
            Quản lý vé
          </h1>

          <p className="tickets-subtitle">
            Quản lý vé tham quan, khách tham quan và triển lãm.
          </p>
        </div>

        <button
          type="button"
          className="tickets-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Thêm vé
        </button>
      </div>

      {error && (
        <div className="tickets-alert tickets-alert-error">
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="tickets-alert tickets-alert-success">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="tickets-stats">
        <div className="tickets-stat">
          <div className="tickets-stat-label">
            Tổng số vé
          </div>

          <div className="tickets-stat-value">
            {statistics.total}
          </div>
        </div>

        <div className="tickets-stat">
          <div className="tickets-stat-label">
            Vé hợp lệ
          </div>

          <div className="tickets-stat-value">
            {statistics.valid}
          </div>
        </div>

        <div className="tickets-stat">
          <div className="tickets-stat-label">
            Đã sử dụng
          </div>

          <div className="tickets-stat-value">
            {statistics.used}
          </div>
        </div>

        <div className="tickets-stat">
          <div className="tickets-stat-label">
            Đã hủy
          </div>

          <div className="tickets-stat-value">
            {statistics.cancelled}
          </div>
        </div>
      </div>

      <div className="tickets-toolbar">
        <div className="tickets-search">
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã vé..."
          />
        </div>

        <select
          className="tickets-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="">
            Tất cả trạng thái
          </option>

          {STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="tickets-filter-buttons">
          <button
            type="button"
            className={`tickets-filter-button ${
              activeFilter === "all"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveFilter("all")}
          >
            Tất cả
          </button>

          <button
            type="button"
            className={`tickets-filter-button ${
              activeFilter === "active"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("active")
            }
          >
            Đang hoạt động
          </button>

          <button
            type="button"
            className={`tickets-filter-button ${
              activeFilter === "inactive"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("inactive")
            }
          >
            Đã hủy
          </button>
        </div>

        <button
          type="button"
          className="tickets-refresh-button"
          onClick={loadTickets}
          title="Làm mới"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="tickets-table-card">
        <div className="tickets-table-wrapper">
          {loading ? (
            <div className="tickets-loading">
              Đang tải danh sách vé...
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="tickets-empty">
              Không có vé phù hợp.
            </div>
          ) : (
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Khách tham quan</th>
                  <th>Triển lãm</th>
                  <th>Loại vé</th>
                  <th>Giá vé</th>
                  <th>Ngày tham quan</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {visibleTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="tickets-code">
                        {ticket.ticket_code}
                      </div>
                    </td>

                    <td>
                      <div className="tickets-visitor-name">
                        {ticket.visitor_name}
                      </div>

                      {ticket.visitor_email && (
                        <div className="tickets-secondary">
                          {ticket.visitor_email}
                        </div>
                      )}
                    </td>

                    <td>
                      <div>
                        {ticket.exhibition_name}
                      </div>

                      <div className="tickets-secondary">
                        ID: {ticket.exhibition_id}
                      </div>
                    </td>

                    <td>
                      {getTicketTypeLabel(
                        ticket.ticket_type,
                      )}
                    </td>

                    <td>
                      <div className="tickets-price">
                        {formatPrice(ticket.price)}
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CalendarDays size={15} />
                        {formatDate(ticket.visit_date)}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`tickets-badge ${getStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {getStatusLabel(
                          ticket.status,
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`tickets-badge ${
                          ticket.is_active
                            ? "tickets-active"
                            : "tickets-inactive"
                        }`}
                      >
                        {ticket.is_active
                          ? "Hoạt động"
                          : "Đã khóa"}
                      </span>
                    </td>

                    <td>
                      <div className="tickets-actions">
                        <button
                          type="button"
                          className="tickets-action-button"
                          title="Chỉnh sửa"
                          onClick={() =>
                            openEditModal(ticket)
                          }
                        >
                          <Edit3 size={16} />
                        </button>

                        {ticket.is_active && (
                          <button
                            type="button"
                            className="tickets-action-button tickets-action-delete"
                            title="Hủy vé"
                            onClick={() =>
                              handleDelete(ticket)
                            }
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
          )}
        </div>
      </div>

      {showModal && (
        <div className="tickets-modal-backdrop">
          <div className="tickets-modal">
            <div className="tickets-modal-header">
              <h2 className="tickets-modal-title">
                {editingTicket
                  ? "Chỉnh sửa vé"
                  : "Thêm vé mới"}
              </h2>

              <button
                type="button"
                className="tickets-modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="tickets-modal-body">
                <div className="tickets-form-grid">
                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="ticket_code"
                    >
                      Mã vé{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <input
                      id="ticket_code"
                      name="ticket_code"
                      type="text"
                      className="tickets-form-control"
                      value={form.ticket_code}
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="VD: TKT-001"
                      disabled={submitting}
                    />

                    <div className="tickets-help">
                      Khi tạo vé quản trị, mã vé do nhân viên nhập.
                    </div>
                  </div>

                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="ticket_type"
                    >
                      Loại vé{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <select
                      id="ticket_type"
                      name="ticket_type"
                      className="tickets-form-control"
                      value={form.ticket_type}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      {TICKET_TYPES.map((type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label} —{" "}
                          {formatPrice(type.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="visitor_id"
                    >
                      Khách tham quan{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <select
                      id="visitor_id"
                      name="visitor_id"
                      className="tickets-form-control"
                      value={form.visitor_id}
                      onChange={handleChange}
                      disabled={
                        submitting || loadingOptions
                      }
                    >
                      <option value="">
                        {loadingOptions
                          ? "Đang tải..."
                          : "Chọn khách tham quan"}
                      </option>

                      {visitors
                        .filter(
                          (visitor) =>
                            visitor.is_active !== false,
                        )
                        .map((visitor) => (
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

                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="exhibition_id"
                    >
                      Triển lãm{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <select
                      id="exhibition_id"
                      name="exhibition_id"
                      className="tickets-form-control"
                      value={form.exhibition_id}
                      onChange={handleChange}
                      disabled={
                        submitting || loadingOptions
                      }
                    >
                      <option value="">
                        {loadingOptions
                          ? "Đang tải..."
                          : "Chọn triển lãm"}
                      </option>

                      {exhibitions
                        .filter(
                          (exhibition) =>
                            exhibition.is_active !== false,
                        )
                        .map((exhibition) => (
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

                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="visit_date"
                    >
                      Ngày tham quan{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <input
                      id="visit_date"
                      name="visit_date"
                      type="date"
                      className="tickets-form-control"
                      value={form.visit_date}
                      onChange={handleChange}
                      disabled={submitting}
                    />

                    {selectedExhibition?.start_date &&
                      selectedExhibition?.end_date && (
                        <div className="tickets-help">
                          Triển lãm diễn ra từ{" "}
                          {formatDate(
                            selectedExhibition.start_date.slice(
                              0,
                              10,
                            ),
                          )}{" "}
                          đến{" "}
                          {formatDate(
                            selectedExhibition.end_date.slice(
                              0,
                              10,
                            ),
                          )}
                          .
                        </div>
                      )}
                  </div>

                  <div className="tickets-form-group">
                    <label
                      className="tickets-form-label"
                      htmlFor="status"
                    >
                      Trạng thái{" "}
                      <span className="tickets-form-required">
                        *
                      </span>
                    </label>

                    <select
                      id="status"
                      name="status"
                      className="tickets-form-control"
                      value={form.status}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tickets-form-group">
                    <label className="tickets-form-label">
                      Giá vé
                    </label>

                    <div className="tickets-price-preview">
                      <span className="tickets-price-preview-label">
                        Backend tự tính
                      </span>

                      <span className="tickets-price-preview-value">
                        {formatPrice(
                          selectedTicketType?.price,
                        )}
                      </span>
                    </div>

                    <div className="tickets-help">
                      Không gửi trường price lên API.
                    </div>
                  </div>

                  {editingTicket && (
                    <div className="tickets-form-group">
                      <label className="tickets-form-label">
                        Trạng thái hoạt động
                      </label>

                      <label className="tickets-checkbox">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={form.is_active}
                          onChange={handleChange}
                          disabled={submitting}
                        />

                        <span>
                          Vé đang hoạt động
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="tickets-form-group tickets-form-group-full">
                    <label
                      className="tickets-form-label"
                      htmlFor="notes"
                    >
                      Ghi chú
                    </label>

                    <textarea
                      id="notes"
                      name="notes"
                      className="tickets-form-control"
                      value={form.notes}
                      onChange={handleChange}
                      maxLength={1000}
                      placeholder="Nhập ghi chú nếu có..."
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="tickets-modal-footer">
                <button
                  type="button"
                  className="tickets-secondary-button"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="tickets-primary-button"
                  disabled={submitting}
                >
                  <TicketIcon size={17} />

                  {submitting
                    ? "Đang lưu..."
                    : editingTicket
                      ? "Lưu thay đổi"
                      : "Tạo vé"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}