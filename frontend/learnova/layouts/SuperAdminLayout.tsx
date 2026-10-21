import type { LegacyValue } from "../../lib/legacy-types";
import useProfile from "../utils/useProfile";

import PublicIcon from "../components/PublicIcon";
import { useState } from "react";
import { NavLink, Link, OutletProvider } from "@/lib/navigation";
import { changeAdminPermission } from "../utils/adminPermissions";

import usePermissions from "../utils/usePermissions";

const links = [["homepage", "Homepage Management", "globe"], ["courses", "Courses", "book"], ["categories", "Categories", "database"], ["batches", "Batches", "users"], ["enrollments", "Enrollments", "check"], ["payments", "Payments & Verification", "briefcase"], ["live-classes", "Live Classes", "video"], ["content", "Lectures & Content", "book"], ["assignments", "Assignments", "design"], ["certificates", "Certificates", "award"], ["reviews", "Reviews & Ratings", "star"], ["notifications", "Notifications", "clock"], ["reports", "Reports & Analytics", "chart"], ["permissions", "Permissions", "target"], ["audit-logs", "Audit Logs", "clock"], ["settings", "Settings", "spark"], ["profile", "Profile", "users"]];
const users = [["students", "Students"], ["teachers", "Teachers"], ["subadmins", "Admins"]];

function SuperAdminLayout({ children }: LegacyValue) {
  const savedProfile = useProfile("ADM-1001");
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const destinations = [["dashboard", "Dashboard"], ...links, ...users];
  const matches = search.trim() ? destinations.filter(([,label]: LegacyValue) => label.toLowerCase().includes(search.trim().toLowerCase())) : [];
  const [message, setMessage] = useState("");
  function updatePermission(id: LegacyValue, key: LegacyValue, enabled: LegacyValue) {
    try { changeAdminPermission(id, key, enabled); setMessage("Permissions saved."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  return <div className={`admin-layout${collapsed ? " admin-sidebar-collapsed" : ""}`}>
    <aside className="admin-sidebar">
      <div className="admin-logo"><img src="/Logo.png" alt="Learnova" /><small>Super Admin Portal</small></div>
      <nav className="admin-nav" aria-label="Super Admin navigation">
        <NavLink to="/superadmin/dashboard" title="Dashboard" aria-label="Dashboard"><PublicIcon name="briefcase"/><span className="admin-nav-label">Dashboard</span></NavLink>
        {links.map(([path, label, icon]: LegacyValue, index: LegacyValue) => (
          <div key={path}>
            <NavLink to={`/superadmin/${path}`} title={label} aria-label={label}><PublicIcon name={icon}/><span className="admin-nav-label">{label}</span></NavLink>
            {index === 0 && <details className="admin-users-group" open>
              <summary title="Users" aria-label="Users"><PublicIcon name="users"/><span className="admin-nav-label">Users</span></summary>
              {users.map(([destination, name]: LegacyValue) => <NavLink key={destination} to={`/superadmin/${destination}`} title={name} aria-label={name}><span className="admin-user-dot" aria-hidden="true"/><span className="admin-nav-label">{name}</span></NavLink>)}
            </details>}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar-bottom"><Link to="/login" aria-label="Logout" title="Logout"><PublicIcon name="arrow"/><span className="admin-nav-label">Logout</span></Link></div>
    </aside>
    <div className="admin-content">
      <header className="admin-topbar">
        <button className="admin-nav-toggle" aria-label="Toggle sidebar" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><PublicIcon name="menu" /></button>
        <div className="admin-header-search"><label><PublicIcon name="search" /><input aria-label="Search Super Admin pages" placeholder="Search anything..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)} onKeyDown={(event: LegacyValue) => { if (event.key === "Escape") setSearch(""); }} /></label>{search.trim() && <div className="admin-search-results">{matches.map(([path,label]: LegacyValue) => <Link key={path} to={`/superadmin/${path}`} onClick={() => setSearch("")}>{label}</Link>)}{!matches.length && <p>No matching Super Admin pages.</p>}</div>}</div>
        <div className="admin-header-actions"><Link className="admin-header-icon" to="/superadmin/notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4" /></svg></Link><Link className="admin-header-icon admin-appearance-link" to="/superadmin/settings" aria-label="Appearance settings"><PublicIcon name="spark" /></Link><Link className="admin-account" to="/superadmin/profile" aria-label="Super Admin profile"><span className="admin-avatar">{savedProfile.image ? <img src={savedProfile.image} alt="My profile"/> : "A"}</span><div><strong>Super Admin</strong><small>Super Administrator</small></div><span className="admin-account-chevron" aria-hidden="true">&#8964;</span></Link></div>
      </header>
      <main className="admin-main"><OutletProvider value={{ permissions, updatePermission, message }}>{children}</OutletProvider></main>
    </div>
  </div>;
}
export default SuperAdminLayout;

