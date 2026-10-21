import type { LegacyValue } from "../../../lib/legacy-types";
import PublicSectionsEditor from "../../components/PublicSectionsEditor";

import { Link } from "@/lib/navigation";
import useCourses from "../../utils/useCourses";
import PublicIcon from "../../components/PublicIcon";

const areas = [
  ["Hero Section", "Main hero title, subtitle, buttons and background.", "globe"],
  ["Banners", "Homepage promotional areas and final call to action.", "design"],
  ["Announcements / Posts", "Public learning announcements and platform updates.", "book"],
  ["Featured Courses", "Featured courses selected from the shared course catalog.", "book"],
  ["Extra Sections", "Categories, career paths and additional homepage sections.", "database"],
  ["Instructor Public Content", "Instructor introductions, specializations and profile cards.", "users"],
];
export default function Homepage() {
  const courses = useCourses();
  const published = courses.filter((course: LegacyValue) => course.status === "Published");
  const featured = published.filter((course: LegacyValue) => course.featured);
  return <section className="admin-homepage">
    <header className="ah-banner"><div><h1>Homepage Management</h1><p>Manage the public homepage sections and content displayed on the website.</p></div><Link to="/">View Website <PublicIcon name="arrow"/></Link></header>
    <section className="ah-overview-panel"><div className="ah-illustration" aria-hidden="true"><div className="ah-browser"><div/><span/><span/><section><PublicIcon name="book"/><PublicIcon name="design"/><PublicIcon name="users"/></section></div></div><div><h2>Homepage Overview</h2><div className="ah-stats">{[["Published Courses",published.length,"book"],["Featured Courses",featured.length,"star"],["Content Areas",areas.length,"globe"]].map(([label,value,icon]: LegacyValue,index: LegacyValue) => <article key={label} className={`ah-tone-${index}`}><span className="ah-icon"><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div></div></section>
    <PublicSectionsEditor role="admin"/><section className="ah-sections"><h2>Homepage Sections</h2><div className="admin-homepage-grid">{areas.map(([title, description, icon]: LegacyValue,index: LegacyValue) => <article key={title} className={`ah-tone-${index}`}><span className="ah-icon"><PublicIcon name={icon}/></span><div><h2>{title}</h2><p>{description}</p><span className="ah-overview">{title === "Featured Courses" ? `${featured.length} courses` : "Content overview"}</span></div>{title === "Featured Courses" && <Link to="/superadmin/courses" aria-label="Manage featured courses"><PublicIcon name="arrow"/></Link>}</article>)}</div><p className="ah-editor-note">Edit public section titles and descriptions above.</p></section>
    <section className="admin-homepage-featured"><header><div><h2>Featured Courses Preview</h2><p>{featured.length} published featured courses in the shared catalog.</p></div><Link to="/superadmin/courses">Manage Courses <PublicIcon name="arrow"/></Link></header><ul>{featured.map((course: LegacyValue) => <li key={course.id}><img src={course.image || "/Logo.png"} alt=""/><div><strong>{course.title}</strong><small>By {course.instructor}</small><small className="ah-rating">{course.rating ? `${course.rating} / 5` : "Not rated"}</small><strong className="ah-price">PKR {course.price}</strong></div><Link to="/superadmin/courses" aria-label={`Manage ${course.title}`}><PublicIcon name="arrow"/></Link></li>)}</ul>{!featured.length && <p>No published featured courses.</p>}</section>
    <section className="ah-access"><PublicIcon name="target"/><div><h2>Public Content Access</h2><p>Control which Admin accounts may manage public website content.</p></div><Link to="/superadmin/public-content">Manage Public Content Permissions <PublicIcon name="arrow"/></Link></section>
  </section>;
}
