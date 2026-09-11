import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit3,
  ImagePlus,
  Landmark,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const EMPTY_FORM = {
  artifact_code: "",
  name: "",
  origin: "",
  period: "",
  material: "",
  description: "",
  image_url: "",
  narration: "",
  is_active: true,
};

const EMPTY_AI_FORM = {
  language: "vi",
  style: "museum",
  target_audience: "general",
  max_length: 500,
  additional_instruction: "",
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

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_URL}${imageUrl}`;
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

export default function Artifacts() {
  const [artifacts, setArtifacts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [generatingNarration, setGeneratingNarration] = useState(false);
  const [savingNarration, setSavingNarration] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [aiForm, setAiForm] = useState(EMPTY_AI_FORM);

  const [showInactive, setShowInactive] = useState(false);

  const filteredArtifacts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return artifacts;
    }

    return artifacts.filter((artifact) => {
      return (
        artifact.artifact_code
          ?.toLowerCase()
          .includes(keyword) ||
        artifact.name
          ?.toLowerCase()
          .includes(keyword) ||
        artifact.origin
          ?.toLowerCase()
          .includes(keyword) ||
        artifact.period
          ?.toLowerCase()
          .includes(keyword) ||
        artifact.material
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [artifacts, search]);

  async function loadArtifacts() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/artifacts`,
        {
          params: {
            include_inactive: showInactive,
          },
          headers: getAuthHeaders(),
        },
      );

      setArtifacts(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải danh sách hiện vật.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArtifacts();
  }, [showInactive]);

  function openCreateModal() {
    setEditingArtifact(null);
    setForm(EMPTY_FORM);
    setAiForm(EMPTY_AI_FORM);

    setError("");
    setSuccess("");
    setAiError("");
    setAiSuccess("");

    setShowModal(true);
  }

  function openEditModal(artifact) {
    setEditingArtifact(artifact);

    setForm({
      artifact_code: artifact.artifact_code || "",
      name: artifact.name || "",
      origin: artifact.origin || "",
      period: artifact.period || "",
      material: artifact.material || "",
      description: artifact.description || "",
      image_url: artifact.image_url || "",
      narration: artifact.narration || "",
      is_active: artifact.is_active ?? true,
    });

    setAiForm(EMPTY_AI_FORM);

    setError("");
    setSuccess("");
    setAiError("");
    setAiSuccess("");

    setShowModal(true);
  }

  function closeModal() {
    if (
      saving ||
      uploading ||
      generatingNarration ||
      savingNarration
    ) {
      return;
    }

    setShowModal(false);
    setEditingArtifact(null);
    setForm(EMPTY_FORM);
    setAiForm(EMPTY_AI_FORM);

    setAiError("");
    setAiSuccess("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleAiChange(event) {
    const { name, value } = event.target;

    setAiForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/api/artifacts/upload-image`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setForm((current) => ({
        ...current,
        image_url: response.data.image_url,
      }));

      setSuccess("Tải hình ảnh lên thành công.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải hình ảnh lên.",
        ),
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleGenerateNarration() {
    if (!editingArtifact) {
      setAiError(
        "Hãy lưu hiện vật trước khi sử dụng chức năng AI.",
      );
      return;
    }

    if (!form.name.trim()) {
      setAiError("Vui lòng nhập tên hiện vật trước.");
      return;
    }

    setGeneratingNarration(true);
    setAiError("");
    setAiSuccess("");
    setError("");

    const payload = {
      language: aiForm.language.trim(),
      style: aiForm.style.trim(),
      target_audience: aiForm.target_audience.trim(),
      max_length: Number(aiForm.max_length),
      additional_instruction:
        aiForm.additional_instruction.trim() || null,
    };

    try {
      const response = await axios.post(
        `${API_URL}/api/artifacts/${editingArtifact.id}/generate-narration`,
        payload,
        {
          headers: getAuthHeaders(),
        },
      );

      const draftNarration =
        response.data?.draft_narration || "";

      setForm((current) => ({
        ...current,
        narration: draftNarration,
      }));

      setAiSuccess(
        "AI đã tạo bản nháp. Hãy kiểm tra và chỉnh sửa trước khi lưu chính thức.",
      );
    } catch (requestError) {
      setAiError(
        getErrorMessage(
          requestError,
          "Không thể tạo nội dung thuyết minh bằng AI.",
        ),
      );
    } finally {
      setGeneratingNarration(false);
    }
  }

  async function handleSaveNarration() {
    if (!editingArtifact) {
      setAiError(
        "Hãy lưu hiện vật trước khi lưu thuyết minh.",
      );
      return;
    }

    const narration = form.narration.trim();

    if (!narration) {
      setAiError(
        "Nội dung thuyết minh không được để trống.",
      );
      return;
    }

    setSavingNarration(true);
    setAiError("");
    setAiSuccess("");

    try {
      const response = await axios.post(
        `${API_URL}/api/artifacts/${editingArtifact.id}/save-narration`,
        {
          narration,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      const savedArtifact = response.data;

      setForm((current) => ({
        ...current,
        narration: savedArtifact.narration || narration,
      }));

      setEditingArtifact((current) =>
        current
          ? {
              ...current,
              narration:
                savedArtifact.narration || narration,
            }
          : current,
      );

      setArtifacts((current) =>
        current.map((artifact) =>
          artifact.id === savedArtifact.id
            ? savedArtifact
            : artifact,
        ),
      );

      setAiSuccess(
        "Đã lưu nội dung thuyết minh chính thức.",
      );
    } catch (requestError) {
      setAiError(
        getErrorMessage(
          requestError,
          "Không thể lưu nội dung thuyết minh.",
        ),
      );
    } finally {
      setSavingNarration(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.artifact_code.trim()) {
      setError("Vui lòng nhập mã hiện vật.");
      return;
    }

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên hiện vật.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      artifact_code: form.artifact_code.trim(),
      name: form.name.trim(),
      origin: form.origin.trim() || null,
      period: form.period.trim() || null,
      material: form.material.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      narration: form.narration.trim() || null,
    };

    try {
      if (editingArtifact) {
        payload.is_active = form.is_active;

        await axios.put(
          `${API_URL}/api/artifacts/${editingArtifact.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Cập nhật hiện vật thành công.");
      } else {
        await axios.post(
          `${API_URL}/api/artifacts`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );

        setSuccess("Thêm hiện vật thành công.");
      }

      await loadArtifacts();

      setShowModal(false);
      setEditingArtifact(null);
      setForm(EMPTY_FORM);
      setAiForm(EMPTY_AI_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingArtifact
            ? "Không thể cập nhật hiện vật."
            : "Không thể thêm hiện vật.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(artifact) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hiện vật "${artifact.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/api/artifacts/${artifact.id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setArtifacts((current) =>
        current.filter(
          (item) => item.id !== artifact.id,
        ),
      );

      setSuccess("Đã xóa hiện vật.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể xóa hiện vật.",
        ),
      );
    }
  }

  return (
    <div className="artifacts-page">
      <style>{`
        .artifacts-page {
          width: 100%;
        }

        .artifacts-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .artifacts-header h2 {
          margin: 0 0 6px;
          font-size: 26px;
          font-weight: 700;
          color: #111827;
        }

        .artifacts-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .artifacts-primary-button {
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

        .artifacts-primary-button:hover {
          background: #1f2937;
        }

        .artifacts-toolbar {
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

        .artifacts-search {
          position: relative;
          flex: 1;
          max-width: 520px;
        }

        .artifacts-search svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .artifacts-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          padding: 10px 12px 10px 40px;
          outline: none;
          font-size: 14px;
          color: #111827;
        }

        .artifacts-search input:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
        }

        .artifacts-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #4b5563;
          font-size: 13px;
          white-space: nowrap;
        }

        .artifacts-toolbar-right label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .artifacts-alert {
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          font-size: 14px;
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

        .artifacts-table-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .artifacts-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .artifacts-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        .artifacts-table th {
          background: #f9fafb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 13px 14px;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .artifacts-table td {
          padding: 14px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          vertical-align: middle;
        }

        .artifacts-table tbody tr:hover {
          background: #fafafa;
        }

        .artifact-code {
          font-family: monospace;
          font-size: 13px;
          color: #4b5563;
        }

        .artifact-name {
          font-weight: 600;
          color: #111827;
        }

        .artifact-image {
          width: 54px;
          height: 54px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
        }

        .artifact-no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #9ca3af;
        }

        .artifact-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 600;
        }

        .artifact-status.active {
          background: #dcfce7;
          color: #15803d;
        }

        .artifact-status.inactive {
          background: #f3f4f6;
          color: #6b7280;
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
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
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
          padding: 55px 20px;
          text-align: center;
          color: #6b7280;
        }

        .artifacts-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .artifacts-count {
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
        }

        .artifact-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(17, 24, 39, 0.48);
        }

        .artifact-modal {
          width: min(850px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .artifact-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #e5e7eb;
        }

        .artifact-modal-header h3 {
          margin: 0;
          font-size: 19px;
          color: #111827;
        }

        .artifact-close {
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

        .artifact-close:hover {
          background: #f3f4f6;
        }

        .artifact-form {
          padding: 22px;
        }

        .artifact-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .artifact-form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .artifact-form-group.full {
          grid-column: 1 / -1;
        }

        .artifact-form-group label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .artifact-form-group input,
        .artifact-form-group textarea,
        .artifact-form-group select {
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

        .artifact-form-group textarea {
          min-height: 105px;
          resize: vertical;
        }

        .artifact-form-group input:focus,
        .artifact-form-group textarea:focus,
        .artifact-form-group select:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .artifact-upload-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .artifact-upload-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 9px 12px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .artifact-upload-button:hover {
          background: #f9fafb;
        }

        .artifact-upload-button input {
          display: none;
        }

        .artifact-image-preview {
          width: 74px;
          height: 74px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .artifact-ai-panel {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
        }

        .artifact-ai-panel-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 14px;
        }

        .artifact-ai-panel-header svg {
          flex-shrink: 0;
          color: #4b5563;
          margin-top: 2px;
        }

        .artifact-ai-panel-title {
          margin: 0 0 3px;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
        }

        .artifact-ai-panel-description {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .artifact-ai-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .artifact-ai-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .artifact-ai-field.full {
          grid-column: 1 / -1;
        }

        .artifact-ai-field label {
          color: #4b5563;
          font-size: 12px;
          font-weight: 600;
        }

        .artifact-ai-field input,
        .artifact-ai-field select,
        .artifact-ai-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 7px;
          padding: 8px 9px;
          outline: none;
          background: white;
          color: #111827;
          font-size: 13px;
          font-family: inherit;
        }

        .artifact-ai-field textarea {
          min-height: 72px;
          resize: vertical;
        }

        .artifact-ai-field input:focus,
        .artifact-ai-field select:focus,
        .artifact-ai-field textarea:focus {
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .artifact-ai-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .artifact-ai-generate-button,
        .artifact-ai-save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 8px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .artifact-ai-generate-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .artifact-ai-save-button {
          border: 1px solid #374151;
          background: white;
          color: #374151;
        }

        .artifact-ai-generate-button:hover {
          background: #1f2937;
        }

        .artifact-ai-save-button:hover {
          background: #f9fafb;
        }

        .artifact-ai-generate-button:disabled,
        .artifact-ai-save-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .artifact-ai-alert {
          margin-top: 10px;
          padding: 9px 11px;
          border-radius: 7px;
          font-size: 12px;
          line-height: 1.5;
        }

        .artifact-ai-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .artifact-ai-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .artifact-narration-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
        }

        .artifact-narration-status {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        .artifact-ai-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 8px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: #fafafa;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .artifact-ai-note svg {
          flex-shrink: 0;
          color: #6b7280;
          margin-top: 1px;
        }

        .artifact-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .artifact-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #e5e7eb;
        }

        .artifact-secondary-button,
        .artifact-save-button {
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

        .artifact-secondary-button {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .artifact-save-button {
          border: 1px solid #111827;
          background: #111827;
          color: white;
        }

        .artifact-save-button:disabled,
        .artifact-secondary-button:disabled,
        .artifacts-primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 800px) {
          .artifact-ai-grid {
            grid-template-columns: 1fr;
          }

          .artifact-ai-field.full {
            grid-column: auto;
          }
        }

        @media (max-width: 700px) {
          .artifacts-header,
          .artifacts-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .artifacts-primary-button {
            justify-content: center;
          }

          .artifacts-toolbar-right {
            justify-content: space-between;
          }

          .artifact-form-grid {
            grid-template-columns: 1fr;
          }

          .artifact-form-group.full {
            grid-column: auto;
          }

          .artifact-narration-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .artifact-ai-actions {
            justify-content: stretch;
          }

          .artifact-ai-generate-button,
          .artifact-ai-save-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="artifacts-header">
        <div>
          <h2>Quản lý hiện vật</h2>

          <p>
            Quản lý thông tin, hình ảnh và nội dung thuyết minh
            của hiện vật.
          </p>
        </div>

        <button
          type="button"
          className="artifacts-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Thêm hiện vật
        </button>
      </div>

      {error && (
        <div className="artifacts-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="artifacts-alert success">
          {success}
        </div>
      )}

      <div className="artifacts-toolbar">
        <div className="artifacts-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo mã, tên, nguồn gốc, thời kỳ..."
          />
        </div>

        <div className="artifacts-toolbar-right">
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

      <div className="artifacts-table-card">
        <div className="artifacts-count">
          Hiển thị{" "}
          <strong>{filteredArtifacts.length}</strong>{" "}
          hiện vật
        </div>

        {loading ? (
          <div className="artifacts-loading">
            <Loader2 size={20} />
            Đang tải danh sách hiện vật...
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="artifacts-empty">
            <Landmark
              size={40}
              strokeWidth={1.4}
            />

            <p>
              Không có hiện vật phù hợp.
            </p>
          </div>
        ) : (
          <div className="artifacts-table-wrapper">
            <table className="artifacts-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Mã hiện vật</th>
                  <th>Tên hiện vật</th>
                  <th>Nguồn gốc</th>
                  <th>Thời kỳ</th>
                  <th>Chất liệu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredArtifacts.map((artifact) => (
                  <tr key={artifact.id}>
                    <td>
                      {artifact.image_url ? (
                        <img
                          src={getImageUrl(
                            artifact.image_url,
                          )}
                          alt={artifact.name}
                          className="artifact-image"
                        />
                      ) : (
                        <div className="artifact-no-image">
                          <Landmark size={22} />
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="artifact-code">
                        {artifact.artifact_code}
                      </span>
                    </td>

                    <td>
                      <span className="artifact-name">
                        {artifact.name}
                      </span>
                    </td>

                    <td>
                      {artifact.origin || "—"}
                    </td>

                    <td>
                      {artifact.period || "—"}
                    </td>

                    <td>
                      {artifact.material || "—"}
                    </td>

                    <td>
                      <span
                        className={`artifact-status ${
                          artifact.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {artifact.is_active
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </td>

                    <td>
                      <div className="artifact-actions">
                        <button
                          type="button"
                          className="artifact-action-button"
                          onClick={() =>
                            openEditModal(artifact)
                          }
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="artifact-action-button delete"
                          onClick={() =>
                            handleDelete(artifact)
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
        <div className="artifact-modal-overlay">
          <div
            className="artifact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="artifact-modal-title"
          >
            <div className="artifact-modal-header">
              <h3 id="artifact-modal-title">
                {editingArtifact
                  ? "Chỉnh sửa hiện vật"
                  : "Thêm hiện vật"}
              </h3>

              <button
                type="button"
                className="artifact-close"
                onClick={closeModal}
                disabled={
                  saving ||
                  uploading ||
                  generatingNarration ||
                  savingNarration
                }
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="artifact-form"
              onSubmit={handleSubmit}
            >
              <div className="artifact-form-grid">
                <div className="artifact-form-group">
                  <label htmlFor="artifact_code">
                    Mã hiện vật *
                  </label>

                  <input
                    id="artifact_code"
                    name="artifact_code"
                    value={form.artifact_code}
                    onChange={handleChange}
                    placeholder="VD: HV001"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="artifact-form-group">
                  <label htmlFor="name">
                    Tên hiện vật *
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tên hiện vật"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="artifact-form-group">
                  <label htmlFor="origin">
                    Nguồn gốc
                  </label>

                  <input
                    id="origin"
                    name="origin"
                    value={form.origin}
                    onChange={handleChange}
                    placeholder="Nguồn gốc / xuất xứ"
                    maxLength={255}
                  />
                </div>

                <div className="artifact-form-group">
                  <label htmlFor="period">
                    Thời kỳ
                  </label>

                  <input
                    id="period"
                    name="period"
                    value={form.period}
                    onChange={handleChange}
                    placeholder="VD: Thời Nguyễn"
                    maxLength={255}
                  />
                </div>

                <div className="artifact-form-group full">
                  <label htmlFor="material">
                    Chất liệu
                  </label>

                  <input
                    id="material"
                    name="material"
                    value={form.material}
                    onChange={handleChange}
                    placeholder="VD: Đồng"
                    maxLength={255}
                  />
                </div>

                <div className="artifact-form-group full">
                  <label htmlFor="description">
                    Mô tả
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả chi tiết hiện vật..."
                  />
                </div>

                <div className="artifact-form-group full">
                  <label>
                    Hình ảnh
                  </label>

                  <div className="artifact-upload-row">
                    <label className="artifact-upload-button">
                      <ImagePlus size={17} />

                      {uploading
                        ? "Đang tải..."
                        : "Chọn hình ảnh"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>

                    {form.image_url && (
                      <img
                        src={getImageUrl(
                          form.image_url,
                        )}
                        alt="Xem trước"
                        className="artifact-image-preview"
                      />
                    )}
                  </div>
                </div>

                <div className="artifact-form-group full">
                  <div className="artifact-ai-panel">
                    <div className="artifact-ai-panel-header">
                      <Sparkles size={18} />

                      <div>
                        <p className="artifact-ai-panel-title">
                          AI tạo thuyết minh
                        </p>

                        <p className="artifact-ai-panel-description">
                          Gemini chỉ tạo bản nháp dựa trên thông
                          tin hiện vật. Nhân viên phải kiểm tra,
                          chỉnh sửa và phê duyệt trước khi lưu
                          thành nội dung chính thức.
                        </p>
                      </div>
                    </div>

                    {!editingArtifact ? (
                      <div className="artifact-ai-note">
                        <Sparkles size={17} />

                        <span>
                          Hãy lưu hiện vật trước. Sau đó mở lại
                          chức năng chỉnh sửa để sử dụng AI tạo
                          thuyết minh.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="artifact-ai-grid">
                          <div className="artifact-ai-field">
                            <label htmlFor="ai-language">
                              Ngôn ngữ
                            </label>

                            <select
                              id="ai-language"
                              name="language"
                              value={aiForm.language}
                              onChange={handleAiChange}
                              disabled={
                                generatingNarration ||
                                savingNarration
                              }
                            >
                              <option value="vi">
                                Tiếng Việt
                              </option>

                              <option value="en">
                                English
                              </option>
                            </select>
                          </div>

                          <div className="artifact-ai-field">
                            <label htmlFor="ai-style">
                              Phong cách
                            </label>

                            <select
                              id="ai-style"
                              name="style"
                              value={aiForm.style}
                              onChange={handleAiChange}
                              disabled={
                                generatingNarration ||
                                savingNarration
                              }
                            >
                              <option value="museum">
                                Bảo tàng
                              </option>

                              <option value="academic">
                                Học thuật
                              </option>

                              <option value="simple">
                                Dễ hiểu
                              </option>

                              <option value="storytelling">
                                Kể chuyện
                              </option>
                            </select>
                          </div>

                          <div className="artifact-ai-field">
                            <label htmlFor="ai-audience">
                              Đối tượng
                            </label>

                            <select
                              id="ai-audience"
                              name="target_audience"
                              value={aiForm.target_audience}
                              onChange={handleAiChange}
                              disabled={
                                generatingNarration ||
                                savingNarration
                              }
                            >
                              <option value="general">
                                Khách tham quan
                              </option>

                              <option value="student">
                                Học sinh / sinh viên
                              </option>

                              <option value="children">
                                Trẻ em
                              </option>

                              <option value="researcher">
                                Người nghiên cứu
                              </option>
                            </select>
                          </div>

                          <div className="artifact-ai-field">
                            <label htmlFor="ai-max-length">
                              Độ dài tối đa
                            </label>

                            <input
                              id="ai-max-length"
                              name="max_length"
                              type="number"
                              min="100"
                              max="3000"
                              value={aiForm.max_length}
                              onChange={handleAiChange}
                              disabled={
                                generatingNarration ||
                                savingNarration
                              }
                            />
                          </div>

                          <div className="artifact-ai-field full">
                            <label htmlFor="ai-instruction">
                              Yêu cầu bổ sung
                            </label>

                            <textarea
                              id="ai-instruction"
                              name="additional_instruction"
                              value={
                                aiForm.additional_instruction
                              }
                              onChange={handleAiChange}
                              placeholder="Ví dụ: Nhấn mạnh giá trị lịch sử của hiện vật..."
                              maxLength={1000}
                              disabled={
                                generatingNarration ||
                                savingNarration
                              }
                            />
                          </div>
                        </div>

                        <div className="artifact-ai-actions">
                          <button
                            type="button"
                            className="artifact-ai-generate-button"
                            onClick={
                              handleGenerateNarration
                            }
                            disabled={
                              generatingNarration ||
                              savingNarration ||
                              saving ||
                              uploading
                            }
                          >
                            {generatingNarration ? (
                              <Loader2 size={16} />
                            ) : (
                              <Sparkles size={16} />
                            )}

                            {generatingNarration
                              ? "Đang tạo..."
                              : "AI tạo bản nháp"}
                          </button>
                        </div>

                        {aiError && (
                          <div className="artifact-ai-alert error">
                            {aiError}
                          </div>
                        )}

                        {aiSuccess && (
                          <div className="artifact-ai-alert success">
                            {aiSuccess}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="artifact-form-group full">
                  <label htmlFor="narration">
                    Lời thuyết minh
                  </label>

                  <textarea
                    id="narration"
                    name="narration"
                    value={form.narration}
                    onChange={handleChange}
                    placeholder="Nội dung thuyết minh hiện vật..."
                    disabled={
                      saving ||
                      uploading ||
                      generatingNarration ||
                      savingNarration
                    }
                  />

                  {editingArtifact && (
                    <div className="artifact-narration-actions">
                      <span className="artifact-narration-status">
                        Nội dung trong ô này là nội dung sẽ được
                        lưu chính thức.
                      </span>

                      <button
                        type="button"
                        className="artifact-ai-save-button"
                        onClick={handleSaveNarration}
                        disabled={
                          savingNarration ||
                          generatingNarration ||
                          saving ||
                          uploading ||
                          !form.narration.trim()
                        }
                      >
                        {savingNarration && (
                          <Loader2 size={16} />
                        )}

                        {savingNarration
                          ? "Đang lưu..."
                          : "Lưu thuyết minh"}
                      </button>
                    </div>
                  )}

                  <div className="artifact-ai-note">
                    <Sparkles size={17} />

                    <span>
                      AI không tự động ghi nội dung vào hệ thống.
                      Nhân viên cần kiểm tra bản nháp, chỉnh sửa
                      nếu cần và nhấn "Lưu thuyết minh" để xác
                      nhận nội dung chính thức.
                    </span>
                  </div>
                </div>

                {editingArtifact && (
                  <div className="artifact-form-group full">
                    <label className="artifact-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />

                      Hiện vật đang hoạt động
                    </label>
                  </div>
                )}
              </div>

              <div className="artifact-form-footer">
                <button
                  type="button"
                  className="artifact-secondary-button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    uploading ||
                    generatingNarration ||
                    savingNarration
                  }
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="artifact-save-button"
                  disabled={
                    saving ||
                    uploading ||
                    generatingNarration ||
                    savingNarration
                  }
                >
                  {saving && (
                    <Loader2 size={16} />
                  )}

                  {saving
                    ? "Đang lưu..."
                    : editingArtifact
                      ? "Lưu thay đổi"
                      : "Thêm hiện vật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}