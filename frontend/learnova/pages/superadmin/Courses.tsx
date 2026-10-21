import type { LegacyValue } from "../../../lib/legacy-types";
﻿
import CoursesManagement from "../admin/Courses";
import useCourses from "../../utils/useCourses";
import PublicIcon from "../../components/PublicIcon";

export default function Courses() {
  const courses = useCourses();
  const stats = [["Total Courses", courses.length, "book"], ["Total Enrollments", courses.reduce((total: LegacyValue, course: LegacyValue) => total + (Number(course.students) || 0), 0), "users"], ["Published Courses", courses.filter((course: LegacyValue) => course.status === "Published").length, "video"], ["Draft Courses", courses.filter((course: LegacyValue) => course.status === "Draft").length, "book"]];
  return <section className="admin-courses"><header className="aco-banner"><div><small>Dashboard &rsaquo; Courses</small><h1>Courses</h1><p>Manage your courses, create new content, and build amazing learning experiences.</p></div><blockquote>&ldquo;A great course can<br/>change someone’s life.&rdquo;<cite>&mdash; Anonymous</cite></blockquote><PublicIcon name="cap"/></header><div className="aco-stats">{stats.map(([label,value,icon]: LegacyValue,index: LegacyValue) => <article key={label} className={`aco-tone-${index}`}><span><PublicIcon name={icon}/></span><div><strong>{value.toLocaleString()}</strong><p>{label}</p><small>Shared course catalog</small></div></article>)}</div><CoursesManagement showImages adminForm /></section>;
}
