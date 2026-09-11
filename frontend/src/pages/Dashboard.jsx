import {
  Landmark,
  CalendarDays,
  Users,
  Ticket,
  Map,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const statistics = [
  {
    title: "Hiện vật",
    value: "0",
    description: "Tổng số hiện vật",
    icon: Landmark,
  },
  {
    title: "Triển lãm",
    value: "0",
    description: "Tổng số triển lãm",
    icon: CalendarDays,
  },
  {
    title: "Khách tham quan",
    value: "0",
    description: "Tổng số khách",
    icon: Users,
  },
  {
    title: "Vé",
    value: "0",
    description: "Tổng số vé",
    icon: Ticket,
  },
];

const modules = [
  {
    title: "Quản lý hiện vật",
    description: "Thêm, sửa, xóa và quản lý thông tin hiện vật.",
    path: "/artifacts",
    icon: Landmark,
  },
  {
    title: "Khu vực trưng bày",
    description: "Quản lý các khu vực trưng bày trong bảo tàng.",
    path: "/exhibition-areas",
    icon: Map,
  },
  {
    title: "Quản lý triển lãm",
    description: "Quản lý thông tin và lịch triển lãm.",
    path: "/exhibitions",
    icon: CalendarDays,
  },
  {
    title: "Khách tham quan",
    description: "Quản lý thông tin khách tham quan.",
    path: "/visitors",
    icon: Users,
  },
  {
    title: "Quản lý vé",
    description: "Theo dõi và quản lý vé tham quan.",
    path: "/tickets",
    icon: Ticket,
  },
  {
    title: "Phản hồi",
    description: "Xem và quản lý phản hồi của khách tham quan.",
    path: "/feedback",
    icon: MessageSquare,
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* =========================
          WELCOME
      ========================= */}

      <section className="dashboard-welcome">
        <div>
          <h2>Trang chủ</h2>

          <p className="dashboard-greeting">
            Xin chào, Admin!
          </p>

          <p className="dashboard-description">
            Chào mừng bạn đến với hệ thống quản lý bảo tàng
            MuseumAI.
          </p>
        </div>
      </section>

      {/* =========================
          OVERVIEW
      ========================= */}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h3>Tổng quan</h3>

            <p>
              Thống kê tổng quan hệ thống
            </p>
          </div>
        </div>

        <div className="dashboard-stat-grid">
          {statistics.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="dashboard-stat-card"
              >
                <div className="dashboard-stat-icon">
                  <Icon size={20} />
                </div>

                <div className="dashboard-stat-content">
                  <span>{item.title}</span>

                  <strong>{item.value}</strong>

                  <small>
                    {item.description}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================
          MANAGEMENT MODULES
      ========================= */}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h3>Quản lý hệ thống</h3>

            <p>
              Truy cập nhanh các chức năng quản lý
            </p>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {modules.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.path}
                href={item.path}
                className="dashboard-module-card"
              >
                <div className="dashboard-module-top">
                  <div className="dashboard-module-icon">
                    <Icon size={20} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="dashboard-module-arrow"
                  />
                </div>

                <h4>{item.title}</h4>

                <p>{item.description}</p>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}