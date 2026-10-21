"use client";

import type { LegacyValue } from "../../lib/legacy-types";
import useProfile from "../utils/useProfile";

import { Link, Outlet, useLocation } from "@/lib/navigation";

function TeacherLayout({ children }: LegacyValue) {
  const savedProfile = useProfile("TCH-1001");
  const location = useLocation();

  const isActive = (path: LegacyValue) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="teacher-layout">

      <aside className="teacher-sidebar">

        <div className="teacher-logo">
          <img src="/Logo.png" alt="Learnova" />
        </div>

        <nav className="teacher-nav">

          <Link
            to="/teacher/dashboard"
            className={isActive("/teacher/dashboard")}
          >
            <span>▣</span>
            Dashboard
          </Link>

          <Link
            to="/teacher/profile"
            className={isActive("/teacher/profile")}
          >
            <span>◉</span>
            Profile
          </Link>

          <Link
            to="/teacher/courses"
            className={isActive("/teacher/courses")}
          >
            <span>▤</span>
            My Courses
          </Link>

          <Link
            to="/teacher/batches"
            className={isActive("/teacher/batches")}
          >
            <span>◫</span>
            My Batches
          </Link>

          <Link
            to="/teacher/content"
            className={isActive("/teacher/content")}
          >
            <span>▥</span>
            Lectures & Content
          </Link>

          <Link
            to="/teacher/assignments"
            className={isActive("/teacher/assignments")}
          >
            <span>✓</span>
            Assignments
          </Link>

          <Link
            to="/teacher/students"
            className={isActive("/teacher/students")}
          >
            <span>♟</span>
            Students
          </Link>

          <Link
            to="/teacher/schedule"
            className={isActive("/teacher/schedule")}
          >
            <span>◷</span>
            Schedule
          </Link>

          <Link
            to="/teacher/live-classes"
            className={isActive("/teacher/live-classes")}
          >
            <span>▶</span>
            Live Classes
          </Link>

          <Link
            to="/teacher/recordings"
            className={isActive("/teacher/recordings")}
          >
            <span>▣</span>
            Recordings & Notes
          </Link>

          <Link
            to="/teacher/progress"
            className={isActive("/teacher/progress")}
          >
            <span>◒</span>
            Student Progress
          </Link>

          <Link
            to="/teacher/notifications"
            className={isActive("/teacher/notifications")}
          >
            <span>●</span>
            Notifications
          </Link>

          <Link
            to="/teacher/settings"
            className={isActive("/teacher/settings")}
          >
            <span>⚙</span>
            Settings
          </Link>

        </nav>

        <div className="teacher-sidebar-bottom">

          <Link to="/teacher/logout" className={isActive("/teacher/logout")}>
            <span>↪</span>
            Logout
          </Link>

        </div>

      </aside>

      <div className="teacher-content">

        <header className="teacher-topbar">

          <div>
            <h2>Teacher Panel</h2>
            <p>Learnova Learning Management System</p>
          </div>

          <div className="teacher-user">

            <div className="teacher-avatar">{savedProfile.image ? <img src={savedProfile.image} alt="My profile"/> : "T"}</div>

            <div>
              <strong>Teacher</strong>
              <span>Teacher Account</span>
            </div>

          </div>

        </header>

        <main className="teacher-main">
          {children}
        </main>

      </div>

    </div>
  );
}

export default TeacherLayout;
