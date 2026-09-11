import { Navigate, Outlet, useLocation } from "react-router-dom";

const MANAGEMENT_ROLES = new Set([
  "admin",
  "content_staff",
  "ticket_staff",
]);

export default function ProtectedRoute() {
  const location = useLocation();

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("current_user");

    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch {
    localStorage.removeItem("current_user");
  }

  const role = currentUser?.role?.name || currentUser?.role;

  if (!MANAGEMENT_ROLES.has(role)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          error: "Tài khoản không có quyền truy cập hệ thống quản lý.",
        }}
      />
    );
  }

  return <Outlet />;
}