import type { LegacyValue } from "../../lib/legacy-types";

import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "@/lib/navigation";
import PublicIcon from "./PublicIcon";

function Navbar() {
  const location: LegacyValue = useLocation();
  const navigate = useNavigate();
  const [openAt, setOpenAt] = useState<LegacyValue>(null);
  const [searchDraft, setSearchDraft] = useState<Record<string, LegacyValue>>({ key: null, value: "" });
  const menuOpen = openAt === location.key;
  const query = searchDraft.key === location.key ? searchDraft.value : new URLSearchParams(location.search).get("q") || "";
  const setMenuOpen = (open: LegacyValue) => setOpenAt(open ? location.key : null);
  function searchCourses(event: LegacyValue) {
    event.preventDefault();
    navigate(query.trim() ? "/?q=" + encodeURIComponent(query.trim()) + "#featured-courses" : "/courses");
    setMenuOpen(false);
  }
  return (
    <header className="public-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="logo" aria-label="Learnova home">
        <img src="/Logo.png" alt="Learnova" width="76" height="76" />
        </Link>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(!menuOpen)}><PublicIcon name={menuOpen ? "close" : "menu"} /></button>
        <div id="public-navigation" className={"nav-content " + (menuOpen ? "active" : "")} onKeyDown={(event: LegacyValue) => { if (event.key === "Escape") setMenuOpen(false); }}>
          <div className="nav-links"><NavLink to="/" end>Home</NavLink><NavLink to="/courses">Courses</NavLink><NavLink to="/categories">Categories</NavLink><NavLink to="/about">About</NavLink></div>
          <form className="public-search" role="search" onSubmit={searchCourses}>
            <label className="navbar-sr-only" htmlFor="course-search">Search courses, skills, or instructors</label>
            <input id="course-search" type="search" placeholder="Search courses, skills, or instructors" value={query} onChange={(event: LegacyValue) => setSearchDraft({ key: location.key, value: event.target.value })} maxLength={120} />
            <button type="submit" aria-label="Search courses"><PublicIcon name="search" /></button>
          </form>
          <div className="nav-actions"><Link to="/login" className="login-btn">Log in</Link><Link to="/register" className="register-btn">Get started <PublicIcon name="arrow" /></Link></div>
        </div>
      </nav>
    </header>
  );
}
export default Navbar;
