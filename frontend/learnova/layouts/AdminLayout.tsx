import type { LegacyValue } from "../../lib/legacy-types";
import useAdminTheme, { themeColors } from "../utils/useAdminTheme";
import { useState } from "react";
import PublicIcon from "../components/PublicIcon";
import useProfile from "../utils/useProfile";
import { Link, Outlet, useLocation, Navigate } from "@/lib/navigation";



import { canAccessSubAdminRoute, currentSubAdminId, subAdmins } from "../utils/adminPermissions";
import usePermissions from "../utils/usePermissions";

const navigation = [
  ["/admin/dashboard", "Dashboard", "briefcase"],
  ["/admin/students", "Students", "users"],
  ["/admin/teachers", "Teachers", "users"],
  ["/admin/courses", "Courses", "book"],
  ["/admin/categories", "Categories", "database"],
  ["/admin/batches", "Batches", "users"],
  ["/admin/enrollments", "Enrollments", "check"],
  ["/admin/payments", "Payments & Verification", "briefcase"],
  ["/admin/live-classes", "Live Classes", "video"],
  ["/admin/content", "Course & Content", "book"],
  ["/admin/assignments", "Assignments", "design"],
  ["/admin/certificates", "Certificates", "award"],
  ["/admin/reviews", "Reviews & Ratings", "star"],
  ["/admin/notifications", "Notifications", "clock"],
  ["/admin/reports", "Reports & Analytics", "chart"],
  ["/admin/public-content", "Public Website", "globe"],
  ["/admin/permissions", "Permissions", "target"],
  ["/admin/audit-logs", "Audit Logs", "clock"],
  ["/admin/settings", "Settings", "design"],
  ["/admin/profile", "Profile", "users"],
];

function AdminLayout({ children }: LegacyValue) {
 const theme=useAdminTheme() as keyof typeof themeColors;
  const savedProfile = useProfile(currentSubAdminId);
  const permissions = usePermissions();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const allowedNavigation = navigation.filter(([path]: LegacyValue) => canAccessSubAdminRoute(path, permissions));
  const location = useLocation();

  const isActive = (path: LegacyValue) => {
    const current = location.pathname.replace(/\/+$/, "");
    const target = path.replace(/\/+$/, "");
    if (target === "/admin/dashboard") {
      return current === "/admin" || current === "/admin/dashboard" ? "active" : "";
    }
    return current === target || current.startsWith(`${target}/`) ? "active" : "";
  };

  if (!subAdmins.some((person: LegacyValue) => person.id === currentSubAdminId && person.status === "Active")) return <Navigate to="/login/admin" replace />;

  return (
    <div style={({"--learnova-primary":themeColors[theme],"--sa-accent":themeColors[theme]} as import("react").CSSProperties)} className={`subadmin-layout${collapsed ? " sa-collapsed" : ""}`}>

      <aside className="subadmin-sidebar">

        <div className="subadmin-logo">
          <div className="sa-brand-lockup"><span className="sa-brand-symbol"><img src="/Logo.png" alt="Learnova" /></span><span className="sa-brand-wordmark" aria-hidden="true"><strong>Learnova</strong><small>Learn. Grow. Achieve.</small></span></div><small>Admin Panel</small>
        </div>

        <nav className="subadmin-nav">
          {allowedNavigation.map(([path, label, icon]: LegacyValue) => (
            <Link key={path} to={path} className={isActive(path)} title={label} aria-label={label}><PublicIcon name={icon}/><span className="sa-nav-label">{label}</span></Link>
          ))}
        </nav>

        <div className="subadmin-sidebar-bottom">

          <Link to="/admin/logout" aria-label="Logout" title="Logout">
            <PublicIcon name="arrow"/><span className="sa-nav-label">Logout</span>
          </Link>

        </div>

      </aside>

      <div className="subadmin-content">

        <header className="subadmin-topbar">

          <button className="sa-menu-toggle" aria-label="Toggle sidebar" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><PublicIcon name="menu"/></button>
          <div className="sa-header-search"><label><PublicIcon name="search"/><input aria-label="Search Admin pages" placeholder="Search pages..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)}/></label>{search.trim() && <div className="sa-search-results">{allowedNavigation.filter(([,label]: LegacyValue) => label.toLowerCase().includes(search.trim().toLowerCase())).map(([path,label]: LegacyValue) => <Link key={path} to={path} onClick={() => setSearch("")}>{label}</Link>)}{!allowedNavigation.some(([,label]: LegacyValue) => label.toLowerCase().includes(search.trim().toLowerCase())) && <p>No matching pages.</p>}</div>}</div>
          <Link className="sa-notifications-link" to="/admin/notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></Link>
          <Link className="subadmin-user" to="/admin/profile" aria-label="My profile">

            <div className="subadmin-avatar">{savedProfile.image ? <img src={savedProfile.image} alt="My profile"/> : "SA"}</div>

            <div>
              <strong>{savedProfile.name || subAdmins.find((person: LegacyValue) => person.id === currentSubAdminId)?.name || "Admin"}</strong>
              <span>Administrator</span>
            </div>
            <svg className="sa-profile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </Link>

        </header>

        <main className="subadmin-main">
          {(() => {
            const page = location.pathname.replace(/\/+$/, "").split("/")[2] || "";
            const isKnown = [
              "", "dashboard", "students", "teachers", "courses", "categories",
              "batches", "enrollments", "payments", "live-classes", "content",
              "assignments", "certificates", "reviews", "notifications", "reports",
              "public-content", "permissions", "audit-logs", "settings", "profile", "logout"
            ].includes(page);
            if (!isKnown) {
              return <Navigate to="/admin/dashboard" replace />;
            }
            if (page === "" || canAccessSubAdminRoute(location.pathname, permissions)) {
              return children;
            }
            return (
              <section role="status">
                <h1>Access unavailable</h1>
                <p>Your Super Admin has not enabled access to this module.</p>
                <Link to="/admin/dashboard">Back to Dashboard</Link>
              </section>
            );
          })()}
        </main>
        <footer className="sa-footer"><span>&copy; 2026 Learnova. All rights reserved.</span><nav aria-label="Footer"><span>Privacy</span><span>Terms</span><Link to="/contact">Help</Link></nav></footer>

      </div>

    </div>
  );
}

export default AdminLayout;
