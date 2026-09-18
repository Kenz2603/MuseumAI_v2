import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Landmark,
  Map,
  CalendarDays,
  Users,
  Ticket,
  MessageSquare,
  UserCog,
  History,
  Bot,
  LogOut,
} from "lucide-react";

import AIChatWidget from "../components/ai/AIChatWidget";

const MANAGEMENT_ROLES = new Set([
  "admin",
  "content_staff",
  "ticket_staff",
]);

const menuItems = [
  {
    label: "Trang chủ",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "content_staff", "ticket_staff"],
  },
  {
    label: "Hiện vật",
    path: "/artifacts",
    icon: Landmark,
    roles: ["admin", "content_staff"],
  },
  {
    label: "Khu vực trưng bày",
    path: "/exhibition-areas",
    icon: Map,
    roles: ["admin", "content_staff"],
  },
  {
    label: "Triển lãm",
    path: "/exhibitions",
    icon: CalendarDays,
    roles: ["admin", "content_staff"],
  },
  {
    label: "Khách tham quan",
    path: "/visitors",
    icon: Users,
    roles: ["admin", "ticket_staff"],
  },
  {
    label: "Vé",
    path: "/tickets",
    icon: Ticket,
    roles: ["admin", "ticket_staff"],
  },
  {
    label: "Phản hồi",
    path: "/feedback",
    icon: MessageSquare,
    roles: ["admin", "ticket_staff"],
  },
  {
    label: "Tài khoản",
    path: "/users",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    label: "Lịch sử đăng nhập",
    path: "/login-history",
    icon: History,
    roles: ["admin"],
  },
  {
    label: "Phân tích AI",
    path: "/ai-analysis",
    icon: Bot,
    roles: ["admin", "content_staff", "ticket_staff"],
  },
];

function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("current_user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function getUserRole(user) {
  if (!user) {
    return null;
  }

  if (typeof user.role === "string") {
    return user.role;
  }

  if (user.role?.name) {
    return user.role.name;
  }

  if (user.role_name) {
    return user.role_name;
  }

  return null;
}

function getRoleLabel(role) {
  const roles = {
    admin: "Quản trị viên",
    content_staff: "Nhân viên nội dung",
    ticket_staff: "Nhân viên vé",
  };

  return roles[role] || "Nhân viên";
}

export default function AdminLayout() {
  const navigate = useNavigate();

  const user = getCurrentUser();
  const role = getUserRole(user);

  const username = user?.username || "Admin";
  const fullName = user?.full_name || username;

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  }

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

  if (!MANAGEMENT_ROLES.has(role)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");

    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div>
            <div className="sidebar-title">MuseumAI</div>

            <div className="sidebar-subtitle">
              Management System
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />

          <span>Đăng xuất</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1>MuseumAI</h1>

            <p>Hệ thống quản lý bảo tàng</p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              {fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{fullName}</strong>

              <span>{getRoleLabel(role)}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>

        <footer className="admin-footer">
          <span>© 2026 MuseumAI</span>

          <span>Management System</span>
        </footer>
      </div>

      <AIChatWidget />
    </div>
  );
}