import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Edit3,
  Images,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
  is_active: true,
};

const EMPTY_EXHIBITION_ARTIFACT_FORM = {
  artifact_id: "",
  display_order: "",
  notes: "",
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

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(
      date.getMonth() + 1,
    )}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function toISOString(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingExhibition, setEditingExhibition] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // =========================
  // UC006 - Exhibition Artifacts
  // =========================

  const [showArtifactsModal, setShowArtifactsModal] =
    useState(false);

  const [selectedExhibition, setSelectedExhibition] =
    useState(null);

  const [exhibitionArtifacts, setExhibitionArtifacts] =
    useState([]);

  const [availableArtifacts, setAvailableArtifacts] =
    useState([]);

  const [artifactsLoading, setArtifactsLoading] =
    useState(false);

  const [artifactSaving, setArtifactSaving] =
    useState(false);

  const [artifactError, setArtifactError] =
    useState("");

  const [artifactSuccess, setArtifactSuccess] =
    useState("");

  const [artifactForm, setArtifactForm] = useState(
    EMPTY_EXHIBITION_ARTIFACT_FORM,
  );

  const [editingExhibitionArtifact, setEditingExhibitionArtifact] =
    useState(null);

  const filteredExhibitions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return exhibitions;
    }

    return exhibitions.filter((exhibition) => {
      return (
        exhibition.code
          ?.toLowerCase()
          .includes(keyword) ||
        exhibition.name
          ?.toLowerCase()
          .includes(keyword) ||
        exhibition.location
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [exhibitions, search]);

  // =========================
  // Exhibition CRUD
  // =========================

  async function loadExhibitions() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/exhibitions`,
        {
          params: {
            include_inactive: showInactive,
          },
          headers: getAuthHeaders(),
        },
      );

      setExhibitions(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách triển lãm.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExhibitions();
  }, [showInactive]);

  function openCreateModal() {
    setEditingExhibition(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(exhibition) {
    setEditingExhibition(exhibition);

    setForm({
      code: exhibition.code || "",
      name: exhibition.name || "",
      description: exhibition.description || "",
      start_date: toDateTimeLocal(
        exhibition.start_date,
      ),
      end_date: toDateTimeLocal(
        exhibition.end_date,
      ),
      location: exhibition.location || "",
      is_active: exhibition.is_active ?? true,
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
    setEditingExhibition(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validateForm() {
    if (!form.code.trim()) {
      return "Vui lòng nhập mã triển lãm.";
    }

    if (!form.name.trim()) {
      return "Vui lòng nhập tên triển lãm.";
    }

    if (!form.start_date) {
      return "Vui lòng chọn ngày bắt đầu.";
    }

    if (!form.end_date) {
      return "Vui lòng chọn ngày kết thúc.";
    }

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ.";
    }

    if (endDate <= startDate) {
      return "Ngày kết thúc phải sau ngày bắt đầu.";
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
      code: form.code.trim(),
      name: form.name.trim(),
      description:
        form.description.trim() || null,
      start_date: toISOString(form.start_date),
      end_date: toISOString(form.end_date),
      location: form.location.trim() || null,
    };

    try {
      if (editingExhibition) {
        payload.is_active = form.is_active;

        await axios.put(
          `${API_URL}/api/exhibitions/${editingExhibition.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Cập nhật triển lãm thành công.");
      } else {
        await axios.post(
          `${API_URL}/api/exhibitions`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Thêm triển lãm thành công.");
      }

      await loadExhibitions();

      setShowModal(false);
      setEditingExhibition(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingExhibition
            ? "Không thể cập nhật triển lãm."
            : "Không thể thêm triển lãm.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exhibition) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa triển lãm "${exhibition.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/exhibitions/${exhibition.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setExhibitions((current) =>
        current.filter(
          (item) => item.id !== exhibition.id,
        ),
      );

      setSuccess("Đã xóa triển lãm.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể xóa triển lãm.",
        ),
      );
    }
  }

  // =========================
  // UC006 - Load data
  // =========================

  async function loadAvailableArtifacts() {
    try {
      const response = await axios.get(
        `${API_URL}/api/artifacts`,
        {
          params: {
            include_inactive: false,
          },
          headers: getAuthHeaders(),
        },
      );

      setAvailableArtifacts(response.data);
    } catch (requestError) {
      setArtifactError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách hiện vật.",
        ),
      );
    }
  }

  async function loadExhibitionArtifacts(
    exhibitionId,
  ) {
    setArtifactsLoading(true);
    setArtifactError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/exhibitions/${exhibitionId}/artifacts`,
        {
          headers: getAuthHeaders(),
        },
      );

      setExhibitionArtifacts(response.data);
    } catch (requestError) {
      setArtifactError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách hiện vật trong triển lãm.",
        ),
      );
    } finally {
      setArtifactsLoading(false);
    }
  }

  async function openArtifactsModal(exhibition) {
    setSelectedExhibition(exhibition);
    setShowArtifactsModal(true);

    setExhibitionArtifacts([]);
    setAvailableArtifacts([]);

    setArtifactForm(
      EMPTY_EXHIBITION_ARTIFACT_FORM,
    );

    setEditingExhibitionArtifact(null);

    setArtifactError("");
    setArtifactSuccess("");

    await Promise.all([
      loadExhibitionArtifacts(exhibition.id),
      loadAvailableArtifacts(),
    ]);
  }

  function closeArtifactsModal() {
    if (artifactSaving) {
      return;
    }

    setShowArtifactsModal(false);
    setSelectedExhibition(null);
    setExhibitionArtifacts([]);
    setAvailableArtifacts([]);

    setArtifactForm(
      EMPTY_EXHIBITION_ARTIFACT_FORM,
    );

    setEditingExhibitionArtifact(null);

    setArtifactError("");
    setArtifactSuccess("");
  }

  // =========================
  // UC006 - Form
  // =========================

  function handleArtifactFormChange(event) {
    const { name, value } = event.target;

    setArtifactForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openAddArtifactForm() {
    setEditingExhibitionArtifact(null);

    setArtifactForm(
      EMPTY_EXHIBITION_ARTIFACT_FORM,
    );

    setArtifactError("");
    setArtifactSuccess("");
  }

  function openEditArtifactForm(item) {
    setEditingExhibitionArtifact(item);

    setArtifactForm({
      artifact_id: String(item.artifact_id),
      display_order:
        item.display_order != null
          ? String(item.display_order)
          : "",
      notes: item.notes || "",
    });

    setArtifactError("");
    setArtifactSuccess("");
  }

  function cancelArtifactEdit() {
    setEditingExhibitionArtifact(null);

    setArtifactForm(
      EMPTY_EXHIBITION_ARTIFACT_FORM,
    );

    setArtifactError("");
  }

  // =========================
  // UC006 - Add / Update
  // =========================

  async function handleArtifactSubmit(event) {
    event.preventDefault();

    if (!selectedExhibition) {
      return;
    }

    if (
      !editingExhibitionArtifact &&
      !artifactForm.artifact_id
    ) {
      setArtifactError(
        "Vui lòng chọn hiện vật.",
      );
      return;
    }

    if (
      artifactForm.display_order &&
      Number(artifactForm.display_order) < 1
    ) {
      setArtifactError(
        "Thứ tự trưng bày phải lớn hơn hoặc bằng 1.",
      );
      return;
    }

    setArtifactSaving(true);
    setArtifactError("");
    setArtifactSuccess("");

    try {
      if (editingExhibitionArtifact) {
        const payload = {
          display_order:
            artifactForm.display_order
              ? Number(artifactForm.display_order)
              : null,
          notes:
            artifactForm.notes.trim() || null,
        };

        await axios.put(
          `${API_URL}/api/exhibitions/${selectedExhibition.id}/artifacts/${editingExhibitionArtifact.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setArtifactSuccess(
          "Cập nhật hiện vật trong triển lãm thành công.",
        );
      } else {
        const payload = {
          artifact_id: Number(
            artifactForm.artifact_id,
          ),
          display_order:
            artifactForm.display_order
              ? Number(artifactForm.display_order)
              : null,
          notes:
            artifactForm.notes.trim() || null,
        };

        await axios.post(
          `${API_URL}/api/exhibitions/${selectedExhibition.id}/artifacts`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setArtifactSuccess(
          "Thêm hiện vật vào triển lãm thành công.",
        );
      }

      await loadExhibitionArtifacts(
        selectedExhibition.id,
      );

      setEditingExhibitionArtifact(null);

      setArtifactForm(
        EMPTY_EXHIBITION_ARTIFACT_FORM,
      );
    } catch (requestError) {
      setArtifactError(
        getErrorMessage(
          requestError,
          editingExhibitionArtifact
            ? "Không thể cập nhật hiện vật trong triển lãm."
            : "Không thể thêm hiện vật vào triển lãm.",
        ),
      );
    } finally {
      setArtifactSaving(false);
    }
  }

  // =========================
  // UC006 - Delete
  // =========================

  async function handleRemoveArtifact(item) {
    if (!selectedExhibition) {
      return;
    }

    const artifact = availableArtifacts.find(
      (candidate) =>
        candidate.id === item.artifact_id,
    );

    const artifactName =
      artifact?.name ||
      `ID ${item.artifact_id}`;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hiện vật "${artifactName}" khỏi triển lãm "${selectedExhibition.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setArtifactError("");
    setArtifactSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/exhibitions/${selectedExhibition.id}/artifacts/${item.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setExhibitionArtifacts((current) =>
        current.filter(
          (relation) => relation.id !== item.id,
        ),
      );

      if (
        editingExhibitionArtifact?.id === item.id
      ) {
        setEditingExhibitionArtifact(null);

        setArtifactForm(
          EMPTY_EXHIBITION_ARTIFACT_FORM,
        );
      }

      setArtifactSuccess(
        "Đã xóa hiện vật khỏi triển lãm.",
      );
    } catch (requestError) {
      setArtifactError(
        getErrorMessage(
          requestError,
          "Không thể xóa hiện vật khỏi triển lãm.",
        ),
      );
    }
  }

  // =========================
  // UC006 - Resolve artifact
  // =========================

  function getArtifactById(artifactId) {
    return availableArtifacts.find(
      (artifact) => artifact.id === artifactId,
    );
  }

  const assignedArtifactIds = useMemo(() => {
    return new Set(
      exhibitionArtifacts.map(
        (item) => item.artifact_id,
      ),
    );
  }, [exhibitionArtifacts]);

  const selectableArtifacts = useMemo(() => {
    return availableArtifacts.filter((artifact) => {
      if (
        editingExhibitionArtifact?.artifact_id ===
        artifact.id
      ) {
        return true;
      }

      return !assignedArtifactIds.has(
        artifact.id,
      );
    });
  }, [
    availableArtifacts,
    assignedArtifactIds,
    editingExhibitionArtifact,
  ]);

  return (
    <div className="exhibitions-page">
      <style>{`
        .exhibitions-page {
          width: 100%;
        }

        .exhibitions-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .exhibitions-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .exhibitions-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .exhibitions-primary-button {
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

        .exhibitions-primary-button:hover {
          background: #1f2937;
        }

        .exhibitions-toolbar {
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

        .exhibitions-search {
          position: relative;
          flex: 1;
          max-width: 520px;
        }

        .exhibitions-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .exhibitions-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 12px 10px 40px;
          outline: none;
          font-size: 14px;
          color: #111827;
        }

        .exhibitions-search input:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
        }

        .exhibitions-toolbar-right {
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .exhibitions-toolbar-right label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .exhibitions-alert {
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
        }

        .exhibitions-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .exhibitions-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .exhibitions-table-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .exhibitions-count {
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }

        .exhibitions-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .exhibitions-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .exhibitions-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .exhibitions-table td {
          padding: 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          vertical-align: middle;
        }

        .exhibitions-table tbody tr:hover {
          background: #fafafa;
        }

        .exhibition-code {
          font-family: monospace;
          font-size: 13px;
          color: #4b5563;
        }

        .exhibition-name {
          font-weight: 600;
          color: #111827;
        }

        .exhibition-description {
          max-width: 320px;
          color: #6b7280;
          line-height: 1.5;
        }

        .exhibition-date {
          white-space: nowrap;
          color: #4b5563;
          font-size: 13px;
        }

        .exhibition-location {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #4b5563;
        }

        .exhibition-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
        }

        .exhibition-status.active {
          background: #dcfce7;
          color: #15803d;
        }

        .exhibition-status.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .exhibition-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .exhibition-action-button {
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

        .exhibition-action-button:hover {
          background: #f9fafb;
        }

        .exhibition-action-button.delete:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .exhibition-action-button.artifacts:hover {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .exhibitions-empty,
        .exhibitions-loading {
          padding: 55px 20px;
          text-align: center;
          color: #6b7280;
        }

        .exhibitions-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .exhibition-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.48);
        }

        .exhibition-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .exhibition-artifacts-modal {
          width: min(1000px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .exhibition-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .exhibition-modal-header h3 {
          margin: 0;
          font-size: 19px;
          color: #111827;
        }

        .exhibition-modal-header p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 13px;
        }

        .exhibition-close {
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

        .exhibition-close:hover {
          background: #f3f4f6;
        }

        .exhibition-form {
          padding: 22px;
        }

        .exhibition-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .exhibition-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .exhibition-form-group.full {
          grid-column: 1 / -1;
        }

        .exhibition-form-group label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .exhibition-form-group input,
        .exhibition-form-group textarea,
        .exhibition-form-group select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          color: #111827;
          font-size: 14px;
          font-family: inherit;
          background: white;
        }

        .exhibition-form-group textarea {
          min-height: 115px;
          resize: vertical;
        }

        .exhibition-form-group input:focus,
        .exhibition-form-group textarea:focus,
        .exhibition-form-group select:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .exhibition-date-hint {
          color: #6b7280;
          font-size: 12px;
          font-weight: 400;
        }

        .exhibition-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .exhibition-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .exhibition-secondary-button,
        .exhibition-save-button {
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

        .exhibition-secondary-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .exhibition-save-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .exhibition-secondary-button:disabled,
        .exhibition-save-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .artifacts-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .artifacts-count {
          color: #6b7280;
          font-size: 13px;
        }

        .artifacts-add-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: white;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .artifacts-add-button:hover {
          background: #1f2937;
        }

        .artifact-form {
          padding: 18px 22px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .artifact-form-grid {
          display: grid;
          grid-template-columns: minmax(240px, 2fr) minmax(130px, 1fr);
          gap: 14px;
        }

        .artifact-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .artifact-form-group.full {
          grid-column: 1 / -1;
        }

        .artifact-form-group label {
          color: #374151;
          font-size: 12px;
          font-weight: 600;
        }

        .artifact-form-group input,
        .artifact-form-group select,
        .artifact-form-group textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 9px 10px;
          background: white;
          color: #111827;
          font-size: 13px;
          font-family: inherit;
          outline: none;
        }

        .artifact-form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .artifact-form-group input:focus,
        .artifact-form-group select:focus,
        .artifact-form-group textarea:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .artifact-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
        }

        .artifact-table-wrapper {
          overflow-x: auto;
        }

        .artifact-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        .artifact-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 12px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .artifact-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 13px;
          vertical-align: middle;
        }

        .artifact-table tbody tr:hover {
          background: #fafafa;
        }

        .artifact-code {
          font-family: monospace;
          color: #4b5563;
          font-size: 12px;
        }

        .artifact-name {
          font-weight: 600;
          color: #111827;
        }

        .artifact-order {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 30px;
          height: 28px;
          padding: 0 7px;
          border-radius: 7px;
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
        }

        .artifact-notes {
          max-width: 260px;
          color: #6b7280;
          line-height: 1.45;
        }

        .artifact-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .artifact-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          background: white;
          color: #4b5563;
          cursor: pointer;
        }

        .artifact-action-button:hover {
          background: #f9fafb;
        }

        .artifact-action-button.delete:hover {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .artifacts-empty,
        .artifacts-loading {
          padding: 45px 20px;
          text-align: center;
          color: #6b7280;
        }

        .artifacts-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .artifacts-alert {
          margin: 14px 22px 0;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
        }

        .artifacts-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .artifacts-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .artifacts-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 15px 22px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 700px) {
          .exhibitions-header,
          .exhibitions-toolbar,
          .artifacts-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .exhibitions-primary-button {
            justify-content: center;
          }

          .exhibitions-toolbar-right {
            justify-content: space-between;
          }

          .exhibition-form-grid,
          .artifact-form-grid {
            grid-template-columns: 1fr;
          }

          .exhibition-form-group.full,
          .artifact-form-group.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="exhibitions-header">
        <div>
          <h2>Quản lý triển lãm</h2>

          <p>
            Quản lý thông tin, thời gian và địa điểm các
            cuộc triển lãm.
          </p>
        </div>

        <button
          type="button"
          className="exhibitions-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Thêm triển lãm
        </button>
      </div>

      {error && (
        <div className="exhibitions-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="exhibitions-alert success">
          {success}
        </div>
      )}

      <div className="exhibitions-toolbar">
        <div className="exhibitions-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã, tên hoặc địa điểm..."
          />
        </div>

        <div className="exhibitions-toolbar-right">
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

      <div className="exhibitions-table-card">
        <div className="exhibitions-count">
          Hiển thị{" "}
          <strong>
            {filteredExhibitions.length}
          </strong>{" "}
          triển lãm
        </div>

        {loading ? (
          <div className="exhibitions-loading">
            <Loader2 size={20} />
            Đang tải danh sách triển lãm...
          </div>
        ) : filteredExhibitions.length === 0 ? (
          <div className="exhibitions-empty">
            <CalendarDays
              size={40}
              strokeWidth={1.4}
            />

            <p>
              Không có triển lãm phù hợp.
            </p>
          </div>
        ) : (
          <div className="exhibitions-table-wrapper">
            <table className="exhibitions-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên triển lãm</th>
                  <th>Mô tả</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Địa điểm</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredExhibitions.map(
                  (exhibition) => (
                    <tr key={exhibition.id}>
                      <td>
                        <span className="exhibition-code">
                          {exhibition.code}
                        </span>
                      </td>

                      <td>
                        <span className="exhibition-name">
                          {exhibition.name}
                        </span>
                      </td>

                      <td>
                        <div className="exhibition-description">
                          {exhibition.description || "—"}
                        </div>
                      </td>

                      <td>
                        <span className="exhibition-date">
                          {formatDateTime(
                            exhibition.start_date,
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="exhibition-date">
                          {formatDateTime(
                            exhibition.end_date,
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="exhibition-location">
                          <MapPin size={15} />

                          {exhibition.location || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`exhibition-status ${
                            exhibition.is_active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {exhibition.is_active
                            ? "Hoạt động"
                            : "Không hoạt động"}
                        </span>
                      </td>

                      <td>
                        <div className="exhibition-actions">
                          <button
                            type="button"
                            className="exhibition-action-button artifacts"
                            onClick={() =>
                              openArtifactsModal(
                                exhibition,
                              )
                            }
                            title="Quản lý hiện vật"
                          >
                            <Images size={16} />
                          </button>

                          <button
                            type="button"
                            className="exhibition-action-button"
                            onClick={() =>
                              openEditModal(
                                exhibition,
                              )
                            }
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            className="exhibition-action-button delete"
                            onClick={() =>
                              handleDelete(
                                exhibition,
                              )
                            }
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          Exhibition CRUD Modal
          ========================= */}

      {showModal && (
        <div className="exhibition-modal-overlay">
          <div
            className="exhibition-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exhibition-modal-title"
          >
            <div className="exhibition-modal-header">
              <h3 id="exhibition-modal-title">
                {editingExhibition
                  ? "Chỉnh sửa triển lãm"
                  : "Thêm triển lãm"}
              </h3>

              <button
                type="button"
                className="exhibition-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="exhibition-form"
              onSubmit={handleSubmit}
            >
              <div className="exhibition-form-grid">
                <div className="exhibition-form-group">
                  <label htmlFor="exhibition-code">
                    Mã triển lãm *
                  </label>

                  <input
                    id="exhibition-code"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="VD: TL001"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="exhibition-form-group">
                  <label htmlFor="exhibition-name">
                    Tên triển lãm *
                  </label>

                  <input
                    id="exhibition-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tên triển lãm"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="exhibition-form-group">
                  <label htmlFor="exhibition-start">
                    Ngày bắt đầu *
                  </label>

                  <input
                    id="exhibition-start"
                    name="start_date"
                    type="datetime-local"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />

                  <span className="exhibition-date-hint">
                    Chọn ngày và giờ bắt đầu.
                  </span>
                </div>

                <div className="exhibition-form-group">
                  <label htmlFor="exhibition-end">
                    Ngày kết thúc *
                  </label>

                  <input
                    id="exhibition-end"
                    name="end_date"
                    type="datetime-local"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                  />

                  <span className="exhibition-date-hint">
                    Phải sau ngày bắt đầu.
                  </span>
                </div>

                <div className="exhibition-form-group full">
                  <label htmlFor="exhibition-location">
                    Địa điểm
                  </label>

                  <input
                    id="exhibition-location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="VD: Tầng 1 - Sảnh chính"
                    maxLength={255}
                  />
                </div>

                <div className="exhibition-form-group full">
                  <label htmlFor="exhibition-description">
                    Mô tả
                  </label>

                  <textarea
                    id="exhibition-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả nội dung triển lãm..."
                  />
                </div>

                {editingExhibition && (
                  <div className="exhibition-form-group full">
                    <label className="exhibition-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />

                      Triển lãm đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="exhibition-form-footer">
                <button
                  type="button"
                  className="exhibition-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="exhibition-save-button"
                  disabled={saving}
                >
                  {saving && <Loader2 size={16} />}

                  {saving
                    ? "Đang lưu..."
                    : editingExhibition
                      ? "Lưu thay đổi"
                      : "Thêm triển lãm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          UC006 - Artifacts Modal
          ========================= */}

      {showArtifactsModal && selectedExhibition && (
        <div className="exhibition-modal-overlay">
          <div
            className="exhibition-artifacts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="artifacts-modal-title"
          >
            <div className="exhibition-modal-header">
              <div>
                <h3 id="artifacts-modal-title">
                  Quản lý hiện vật trong triển lãm
                </h3>

                <p>
                  {selectedExhibition.code} —{" "}
                  {selectedExhibition.name}
                </p>
              </div>

              <button
                type="button"
                className="exhibition-close"
                onClick={closeArtifactsModal}
                disabled={artifactSaving}
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            {artifactError && (
              <div className="artifacts-alert error">
                {artifactError}
              </div>
            )}

            {artifactSuccess && (
              <div className="artifacts-alert success">
                {artifactSuccess}
              </div>
            )}

            <div className="artifacts-toolbar">
              <div className="artifacts-count">
                Đang có{" "}
                <strong>
                  {exhibitionArtifacts.length}
                </strong>{" "}
                hiện vật trong triển lãm
              </div>

              <button
                type="button"
                className="artifacts-add-button"
                onClick={openAddArtifactForm}
                disabled={artifactSaving}
              >
                <Plus size={16} />
                Thêm hiện vật
              </button>
            </div>

            <form
              className="artifact-form"
              onSubmit={handleArtifactSubmit}
            >
              <div className="artifact-form-grid">
                <div className="artifact-form-group">
                  <label htmlFor="exhibition-artifact">
                    Hiện vật *
                  </label>

                  <select
                    id="exhibition-artifact"
                    name="artifact_id"
                    value={artifactForm.artifact_id}
                    onChange={handleArtifactFormChange}
                    disabled={
                      artifactSaving ||
                      Boolean(
                        editingExhibitionArtifact,
                      )
                    }
                    required
                  >
                    <option value="">
                      -- Chọn hiện vật --
                    </option>

                    {selectableArtifacts.map(
                      (artifact) => (
                        <option
                          key={artifact.id}
                          value={artifact.id}
                        >
                          {artifact.artifact_code} —{" "}
                          {artifact.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="artifact-form-group">
                  <label htmlFor="artifact-display-order">
                    Thứ tự trưng bày
                  </label>

                  <input
                    id="artifact-display-order"
                    name="display_order"
                    type="number"
                    min="1"
                    value={artifactForm.display_order}
                    onChange={handleArtifactFormChange}
                    placeholder="VD: 1"
                    disabled={artifactSaving}
                  />
                </div>

                <div className="artifact-form-group full">
                  <label htmlFor="artifact-notes">
                    Ghi chú
                  </label>

                  <textarea
                    id="artifact-notes"
                    name="notes"
                    value={artifactForm.notes}
                    onChange={handleArtifactFormChange}
                    placeholder="Ghi chú về vị trí, cách trưng bày..."
                    maxLength={1000}
                    disabled={artifactSaving}
                  />
                </div>
              </div>

              <div className="artifact-form-actions">
                {editingExhibitionArtifact && (
                  <button
                    type="button"
                    className="exhibition-secondary-button"
                    onClick={cancelArtifactEdit}
                    disabled={artifactSaving}
                  >
                    Hủy sửa
                  </button>
                )}

                <button
                  type="submit"
                  className="exhibition-save-button"
                  disabled={artifactSaving}
                >
                  {artifactSaving && (
                    <Loader2 size={15} />
                  )}

                  {artifactSaving
                    ? "Đang lưu..."
                    : editingExhibitionArtifact
                      ? "Lưu thay đổi"
                      : "Thêm vào triển lãm"}
                </button>
              </div>
            </form>

            {artifactsLoading ? (
              <div className="artifacts-loading">
                <Loader2 size={20} />
                Đang tải danh sách hiện vật...
              </div>
            ) : exhibitionArtifacts.length ===
              0 ? (
              <div className="artifacts-empty">
                <Images
                  size={40}
                  strokeWidth={1.4}
                />

                <p>
                  Triển lãm chưa có hiện vật nào.
                </p>
              </div>
            ) : (
              <div className="artifact-table-wrapper">
                <table className="artifact-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã hiện vật</th>
                      <th>Tên hiện vật</th>
                      <th>Thứ tự</th>
                      <th>Ghi chú</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {exhibitionArtifacts.map(
                      (item, index) => {
                        const artifact =
                          getArtifactById(
                            item.artifact_id,
                          );

                        return (
                          <tr key={item.id}>
                            <td>{index + 1}</td>

                            <td>
                              <span className="artifact-code">
                                {artifact?.artifact_code ||
                                  `ID ${item.artifact_id}`}
                              </span>
                            </td>

                            <td>
                              <span className="artifact-name">
                                {artifact?.name ||
                                  "Không xác định"}
                              </span>
                            </td>

                            <td>
                              <span className="artifact-order">
                                {item.display_order ??
                                  "—"}
                              </span>
                            </td>

                            <td>
                              <div className="artifact-notes">
                                {item.notes || "—"}
                              </div>
                            </td>

                            <td>
                              <div className="artifact-actions">
                                <button
                                  type="button"
                                  className="artifact-action-button"
                                  onClick={() =>
                                    openEditArtifactForm(
                                      item,
                                    )
                                  }
                                  title="Chỉnh sửa"
                                  disabled={
                                    artifactSaving
                                  }
                                >
                                  <Edit3 size={15} />
                                </button>

                                <button
                                  type="button"
                                  className="artifact-action-button delete"
                                  onClick={() =>
                                    handleRemoveArtifact(
                                      item,
                                    )
                                  }
                                  title="Xóa khỏi triển lãm"
                                  disabled={
                                    artifactSaving
                                  }
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="artifacts-modal-footer">
              <button
                type="button"
                className="exhibition-secondary-button"
                onClick={closeArtifactsModal}
                disabled={artifactSaving}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}