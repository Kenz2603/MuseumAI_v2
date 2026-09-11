import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users as UsersIcon,
  UserCog,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const MANAGEMENT_ROLES = [
  "admin",
  "content_staff",
  "ticket_staff",
];

const USER_ROLES = ["visitor"];

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function getAuthHeaders() {
  const token = getToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Dữ liệu không hợp lệ")
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

function getRoleLabel(roleName) {
  const labels = {
    admin: "Admin",
    content_staff: "Content Staff",
    ticket_staff: "Ticket Staff",
    visitor: "Người dùng",
  };

  return labels[roleName] || roleName;
}

function getRoleDescription(roleName) {
  const descriptions = {
    admin: "Quản trị viên hệ thống",
    content_staff: "Nhân viên quản lý nội dung",
    ticket_staff: "Nhân viên bán và quản lý vé",
    visitor: "Tài khoản người dùng",
  };

  return descriptions[roleName] || "";
}

const emptyForm = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  role_id: "",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [managementSearch, setManagementSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [includeInactiveManagement, setIncludeInactiveManagement] =
    useState(false);

  const [includeInactiveUsers, setIncludeInactiveUsers] =
    useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("current_user") || "null",
      );
    } catch {
      return null;
    }
  }, []);

  const currentUserId = currentUser?.id;

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/users`,
        getAuthHeaders(),
      );

      setUsers(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      setLoadingRoles(true);

      const response = await axios.get(
        `${API_URL}/api/users/roles`,
        getAuthHeaders(),
      );

      setRoles(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingRoles(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const managementUsers = useMemo(() => {
    const keyword = managementSearch.trim().toLowerCase();

    return users.filter((user) => {
      const roleName = user.role?.name;

      if (!MANAGEMENT_ROLES.includes(roleName)) {
        return false;
      }

      if (
        !includeInactiveManagement &&
        !user.is_active
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.full_name?.toLowerCase().includes(keyword) ||
        roleName?.toLowerCase().includes(keyword)
      );
    });
  }, [
    users,
    managementSearch,
    includeInactiveManagement,
  ]);

  const visitorUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const roleName = user.role?.name;

      if (!USER_ROLES.includes(roleName)) {
        return false;
      }

      if (
        !includeInactiveUsers &&
        !user.is_active
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.full_name?.toLowerCase().includes(keyword)
      );
    });
  }, [
    users,
    userSearch,
    includeInactiveUsers,
  ]);

  const managementCount = useMemo(
    () =>
      users.filter((user) =>
        MANAGEMENT_ROLES.includes(user.role?.name),
      ).length,
    [users],
  );

  const visitorCount = useMemo(
    () =>
      users.filter((user) =>
        USER_ROLES.includes(user.role?.name),
      ).length,
    [users],
  );

  const activeManagementCount = useMemo(
    () =>
      users.filter(
        (user) =>
          MANAGEMENT_ROLES.includes(user.role?.name) &&
          user.is_active,
      ).length,
    [users],
  );

  const activeVisitorCount = useMemo(
    () =>
      users.filter(
        (user) =>
          USER_ROLES.includes(user.role?.name) &&
          user.is_active,
      ).length,
    [users],
  );

  const inactiveManagementCount =
    managementCount - activeManagementCount;

  const inactiveVisitorCount =
    visitorCount - activeVisitorCount;

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function openCreateModal() {
    resetMessages();

    const managementRoles = roles.filter((role) =>
      MANAGEMENT_ROLES.includes(role.name),
    );

    const defaultRole =
      managementRoles.find(
        (role) => role.name === "content_staff",
      ) || managementRoles[0];

    setEditingUser(null);

    setForm({
      ...emptyForm,
      role_id: defaultRole
        ? String(defaultRole.id)
        : "",
    });

    setShowModal(true);
  }

  function openEditModal(user) {
    resetMessages();

    setEditingUser(user);

    setForm({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      password: "",
      role_id: user.role_id
        ? String(user.role_id)
        : "",
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    resetMessages();

    if (
      !form.email ||
      !form.full_name ||
      !form.role_id
    ) {
      setError(
        "Vui lòng nhập đầy đủ thông tin bắt buộc.",
      );
      return;
    }

    if (!editingUser && !form.username) {
      setError("Vui lòng nhập username.");
      return;
    }

    if (!editingUser && !form.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        const payload = {
          email: form.email,
          full_name: form.full_name,
          role_id: Number(form.role_id),
        };

        await axios.put(
          `${API_URL}/api/users/${editingUser.id}`,
          payload,
          getAuthHeaders(),
        );

        setSuccess(
          "Cập nhật tài khoản thành công.",
        );
      } else {
        const payload = {
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          role_id: Number(form.role_id),
        };

        await axios.post(
          `${API_URL}/api/users`,
          payload,
          getAuthHeaders(),
        );

        setSuccess("Tạo tài khoản thành công.");
      }

      setShowModal(false);
      setEditingUser(null);
      setForm(emptyForm);

      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    resetMessages();

    if (user.id === currentUserId) {
      setError(
        "Không thể khóa tài khoản Admin hiện tại.",
      );
      return;
    }

    const action = user.is_active
      ? "khóa"
      : "kích hoạt";

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản "${user.username}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await axios.put(
        `${API_URL}/api/users/${user.id}`,
        {
          is_active: !user.is_active,
        },
        getAuthHeaders(),
      );

      setSuccess(
        user.is_active
          ? "Đã khóa tài khoản."
          : "Đã kích hoạt tài khoản.",
      );

      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(user) {
    resetMessages();

    if (user.id === currentUserId) {
      setError(
        "Không thể xóa tài khoản Admin hiện tại.",
      );
      return;
    }

    const roleLabel = getRoleLabel(
      user.role?.name,
    );

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${user.username}"?\n\n` +
        `Vai trò: ${roleLabel}\n` +
        `Họ tên: ${user.full_name}\n\n` +
        `Tài khoản sẽ bị xóa khỏi hệ thống và không thể khôi phục.\n\n` +
        `Nhấn OK để tiếp tục xóa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await axios.delete(
        `${API_URL}/api/users/${user.id}`,
        getAuthHeaders(),
      );

      setSuccess(
        `Đã xóa vĩnh viễn tài khoản "${user.username}".`,
      );

      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    resetMessages();

    await Promise.all([
      loadUsers(),
      loadRoles(),
    ]);

    setSuccess("Đã cập nhật dữ liệu.");
  }

  function renderStatus(user) {
    if (user.is_active) {
      return (
        <span style={styles.activeBadge}>
          <UserCheck size={14} />
          Hoạt động
        </span>
      );
    }

    return (
      <span style={styles.inactiveBadge}>
        <UserX size={14} />
        Đã khóa
      </span>
    );
  }

  function renderActions(user) {
    const isCurrentUser =
      user.id === currentUserId;

    return (
      <div style={styles.actionGroup}>
        <button
          type="button"
          onClick={() => openEditModal(user)}
          style={styles.iconButton}
          title="Chỉnh sửa"
          disabled={saving}
        >
          <Edit3 size={16} />
        </button>

        {!isCurrentUser && (
          <>
            <button
              type="button"
              onClick={() =>
                handleToggleActive(user)
              }
              style={
                user.is_active
                  ? styles.dangerButton
                  : styles.activateButton
              }
              title={
                user.is_active
                  ? "Khóa tài khoản"
                  : "Kích hoạt tài khoản"
              }
              disabled={saving}
            >
              {user.is_active ? (
                <UserX size={16} />
              ) : (
                <UserCheck size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeleteUser(user)
              }
              style={styles.deleteButton}
              title="Xóa vĩnh viễn tài khoản"
              disabled={saving}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Quản lý tài khoản
          </h1>

          <p style={styles.subtitle}>
            Quản lý tài khoản quản lý và tài khoản
            người dùng trong hệ thống MuseumAI.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={handleRefresh}
            style={styles.secondaryButton}
            disabled={
              loading ||
              loadingRoles ||
              saving
            }
          >
            <RefreshCw size={17} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.successBox}>
          {success}
        </div>
      )}

      {/* =========================
          TỔNG QUAN
      ========================== */}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <UserCog size={20} />
          </div>

          <div>
            <span style={styles.statLabel}>
              Tài khoản quản lý
            </span>

            <strong style={styles.statValue}>
              {managementCount}
            </strong>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <UsersIcon size={20} />
          </div>

          <div>
            <span style={styles.statLabel}>
              Tài khoản người dùng
            </span>

            <strong style={styles.statValue}>
              {visitorCount}
            </strong>
          </div>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Quản lý đang hoạt động
          </span>

          <strong style={styles.statValue}>
            {activeManagementCount}
          </strong>

          <span style={styles.statSmall}>
            {inactiveManagementCount} tài khoản bị khóa
          </span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Người dùng đang hoạt động
          </span>

          <strong style={styles.statValue}>
            {activeVisitorCount}
          </strong>

          <span style={styles.statSmall}>
            {inactiveVisitorCount} tài khoản bị khóa
          </span>
        </div>
      </div>

      {/* =========================
          BẢNG 1: TÀI KHOẢN QUẢN LÝ
      ========================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrapper}>
            <div style={styles.managementIcon}>
              <UserCog size={21} />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>
                Tài khoản quản lý
              </h2>

              <p style={styles.sectionDescription}>
                Các tài khoản được phép truy cập
                hệ thống quản lý MuseumAI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            style={styles.primaryButton}
            disabled={loadingRoles || saving}
          >
            <Plus size={18} />
            Thêm tài khoản quản lý
          </button>
        </div>

        <div style={styles.sectionToolbar}>
          <div style={styles.searchWrapper}>
            <Search
              size={18}
              color="#64748b"
              style={styles.searchIcon}
            />

            <input
              type="text"
              placeholder="Tìm username, họ tên, email hoặc role..."
              value={managementSearch}
              onChange={(event) =>
                setManagementSearch(
                  event.target.value,
                )
              }
              style={styles.searchInput}
            />
          </div>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeInactiveManagement}
              onChange={(event) =>
                setIncludeInactiveManagement(
                  event.target.checked,
                )
              }
            />

            Hiển thị tài khoản đã khóa
          </label>
        </div>

        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>
              Đang tải danh sách tài khoản quản lý...
            </div>
          ) : managementUsers.length === 0 ? (
            <div style={styles.empty}>
              Không tìm thấy tài khoản quản lý
              phù hợp.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      ID
                    </th>

                    <th style={styles.th}>
                      Username
                    </th>

                    <th style={styles.th}>
                      Họ tên
                    </th>

                    <th style={styles.th}>
                      Email
                    </th>

                    <th style={styles.th}>
                      Vai trò
                    </th>

                    <th style={styles.th}>
                      Trạng thái
                    </th>

                    <th style={styles.th}>
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {managementUsers.map((user) => {
                    const isCurrentUser =
                      user.id === currentUserId;

                    return (
                      <tr key={user.id}>
                        <td style={styles.td}>
                          {user.id}
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {user.username}
                          </strong>

                          {isCurrentUser && (
                            <span
                              style={styles.youBadge}
                            >
                              Bạn
                            </span>
                          )}
                        </td>

                        <td style={styles.td}>
                          {user.full_name}
                        </td>

                        <td style={styles.td}>
                          {user.email}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={
                              styles.roleBadge
                            }
                          >
                            <Shield size={14} />

                            {getRoleLabel(
                              user.role?.name,
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {renderStatus(user)}
                        </td>

                        <td style={styles.td}>
                          {renderActions(user)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* =========================
          BẢNG 2: TÀI KHOẢN NGƯỜI DÙNG
      ========================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleWrapper}>
            <div style={styles.userIcon}>
              <UsersIcon size={21} />
            </div>

            <div>
              <h2 style={styles.sectionTitle}>
                Tài khoản người dùng
              </h2>

              <p style={styles.sectionDescription}>
                Các tài khoản khách tham quan sử
                dụng hệ thống.
              </p>
            </div>
          </div>

          <div style={styles.countBadge}>
            {visitorCount} tài khoản
          </div>
        </div>

        <div style={styles.sectionToolbar}>
          <div style={styles.searchWrapper}>
            <Search
              size={18}
              color="#64748b"
              style={styles.searchIcon}
            />

            <input
              type="text"
              placeholder="Tìm username, họ tên hoặc email..."
              value={userSearch}
              onChange={(event) =>
                setUserSearch(event.target.value)
              }
              style={styles.searchInput}
            />
          </div>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeInactiveUsers}
              onChange={(event) =>
                setIncludeInactiveUsers(
                  event.target.checked,
                )
              }
            />

            Hiển thị tài khoản đã khóa
          </label>
        </div>

        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>
              Đang tải danh sách người dùng...
            </div>
          ) : visitorUsers.length === 0 ? (
            <div style={styles.empty}>
              Không tìm thấy tài khoản người dùng
              phù hợp.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      ID
                    </th>

                    <th style={styles.th}>
                      Username
                    </th>

                    <th style={styles.th}>
                      Họ tên
                    </th>

                    <th style={styles.th}>
                      Email
                    </th>

                    <th style={styles.th}>
                      Ngày tạo
                    </th>

                    <th style={styles.th}>
                      Trạng thái
                    </th>

                    <th style={styles.th}>
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visitorUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>
                        {user.id}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {user.username}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {user.full_name}
                      </td>

                      <td style={styles.td}>
                        {user.email}
                      </td>

                      <td style={styles.td}>
                        {user.created_at
                          ? new Date(
                              user.created_at,
                            ).toLocaleDateString(
                              "vi-VN",
                            )
                          : "—"}
                      </td>

                      <td style={styles.td}>
                        {renderStatus(user)}
                      </td>

                      <td style={styles.td}>
                        {renderActions(user)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* =========================
          MODAL
      ========================== */}

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingUser
                    ? "Chỉnh sửa tài khoản"
                    : "Thêm tài khoản quản lý"}
                </h2>

                <p style={styles.modalSubtitle}>
                  {editingUser
                    ? "Cập nhật thông tin tài khoản."
                    : "Tạo tài khoản cho nhân sự hệ thống."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={styles.closeButton}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={styles.form}
            >
              {!editingUser && (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Username *
                  </label>

                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Nhập username"
                    minLength={3}
                    maxLength={50}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>
                  Họ và tên *
                </label>

                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên"
                  maxLength={150}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@museumai.vn"
                  style={styles.input}
                  required
                />
              </div>

              {!editingUser && (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Mật khẩu *
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 8 ký tự"
                    minLength={8}
                    maxLength={128}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>
                  Vai trò *
                </label>

                <select
                  name="role_id"
                  value={form.role_id}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  disabled={
                    loadingRoles || saving
                  }
                >
                  <option value="">
                    -- Chọn vai trò --
                  </option>

                  {roles
                    .filter((role) =>
                      MANAGEMENT_ROLES.includes(
                        role.name,
                      ),
                    )
                    .map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {getRoleLabel(role.name)}
                        {" — "}
                        {getRoleDescription(
                          role.name,
                        )}
                      </option>
                    ))}
                </select>
              </div>

              <div style={styles.roleNote}>
                <Shield size={16} />

                <span>
                  Quyền thực tế được kiểm tra tại
                  backend bằng JWT + RBAC.
                </span>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelButton}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={
                    saving || loadingRoles
                  }
                >
                  {saving
                    ? "Đang lưu..."
                    : editingUser
                      ? "Lưu thay đổi"
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

const styles = {
  page: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 16px",
    background: "#fff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorBox: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
  },

  successBox: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    fontSize: "14px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "17px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#2563eb",
    flexShrink: 0,
  },

  statLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "5px",
  },

  statValue: {
    display: "block",
    fontSize: "24px",
    color: "#0f172a",
  },

  statSmall: {
    display: "block",
    marginTop: "3px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  section: {
    marginBottom: "28px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  sectionTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  managementIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#2563eb",
    flexShrink: 0,
  },

  userIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#475569",
    flexShrink: 0,
  },

  sectionTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 700,
    color: "#0f172a",
  },

  sectionDescription: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  countBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 600,
  },

  sectionToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },

  searchWrapper: {
    position: "relative",
    flex: 1,
    minWidth: "280px",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px 11px 40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    background: "#fff",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#475569",
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tableCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    textAlign: "left",
    padding: "13px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 700,
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 600,
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: 600,
  },

  inactiveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: 600,
  },

  youBadge: {
    display: "inline-block",
    marginLeft: "7px",
    padding: "3px 6px",
    borderRadius: "5px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: 600,
  },

  actionGroup: {
    display: "flex",
    gap: "7px",
  },

  iconButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#fff",
    color: "#334155",
    cursor: "pointer",
  },

  dangerButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    background: "#fef2f2",
    color: "#b91c1c",
    cursor: "pointer",
  },

  activateButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #bbf7d0",
    borderRadius: "7px",
    background: "#f0fdf4",
    color: "#15803d",
    cursor: "pointer",
  },

  deleteButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
  },

  loading: {
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
  },

  empty: {
    padding: "50px",
    textAlign: "center",
    color: "#64748b",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "12px",
    boxShadow:
      "0 20px 50px rgba(15, 23, 42, 0.2)",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "7px",
    background: "#f8fafc",
    color: "#475569",
    cursor: "pointer",
  },

  form: {
    padding: "20px",
  },

  field: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
  },

  roleNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "11px 12px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    paddingTop: "5px",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};