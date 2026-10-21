import type { LegacyValue } from "../../lib/legacy-types";
import useBatches from "../utils/useBatches";
import { studentLiveNotifications } from "../utils/batchStorage";
import useProfile from "../utils/useProfile";

import { Link, Outlet, useLocation } from "@/lib/navigation";

function StudentLayout({ children }: LegacyValue) {
  const alerts = studentLiveNotifications(useBatches()).filter((item: LegacyValue) => item.unread);
  const savedProfile = useProfile("STU-1001");
  const location = useLocation();

  const isActive = (path: LegacyValue) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="student-layout">

      <aside className="student-sidebar">

        <div className="student-logo">
          <img src="/Logo.png" alt="Learnova" />
        </div>

        <nav className="student-nav">

          <Link
            to="/student/dashboard"
            className={isActive("/student/dashboard")}
          >
            <span>▣</span>
            Dashboard
          </Link>

          <Link
            to="/student/profile"
            className={isActive("/student/profile")}
          >
            <span>◉</span>
            Profile
          </Link>

          <Link
            to="/student/courses"
            className={isActive("/student/courses")}
          >
            <span>▤</span>
            My Courses
          </Link>

          <Link
            to="/student/browse-courses"
            className={isActive("/student/browse-courses")}
          >
            <span>⌕</span>
            Browse Courses
          </Link>

          <Link
            to="/student/live-classes"
            className={isActive("/student/live-classes")}
          >
            <span>▶</span>
            Live Classes
          </Link>

          <Link
            to="/student/assignments"
            className={isActive("/student/assignments")}
          >
            <span>✓</span>
            Assignments
          </Link>

          <Link
            to="/student/progress"
            className={isActive("/student/progress")}
          >
            <span>◒</span>
            Progress
          </Link>

          <Link
            to="/student/certificates"
            className={isActive("/student/certificates")}
          >
            <span>▧</span>
            Certificates
          </Link>

          <Link
            to="/student/notifications"
            className={isActive("/student/notifications")}
          >
            <span>●</span>
            Notifications
          </Link>

          <Link
            to="/student/settings"
            className={isActive("/student/settings")}
          >
            <span>⚙</span>
            Settings
          </Link>

        <Link to="/student/payments" className={isActive("/student/payments")}>Payments &amp; Enrollment</Link></nav>

        <div className="student-sidebar-bottom">
          <Link to="/login">
            <span>↪</span>
            Logout
          </Link>
        </div>

      </aside>

      <div className="student-content">

        <header className="student-topbar">
          <Link to="/student/notifications" aria-live="polite">Notifications ({alerts.length}){alerts.some((item: LegacyValue) => item.live) ? " - Live lecture started" : ""}</Link>

          <div>
            <h2>Student Panel</h2>
            <p>Learnova Learning Management System</p>
          </div>

          <div className="student-user">
            <div className="student-avatar">{savedProfile.image ? <img src={savedProfile.image} alt="My profile"/> : "S"}</div>

            <div>
              <strong>Student</strong>
              <span>Student Account</span>
            </div>
          </div>

        </header>

        <main className="student-main">
          {children}
        </main>

      </div>

    </div>
  );
}

export default StudentLayout;