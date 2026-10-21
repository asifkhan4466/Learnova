import type { LegacyValue } from "../../../lib/legacy-types";
import PeopleManager from "../../components/PeopleManager";

import { useRef, useState } from "react";
import { usePeople } from "../../utils/peopleStorage";
import useBatches from "../../utils/useBatches";
import useCourses from "../../utils/useCourses";
import PublicIcon from "../../components/PublicIcon";

export default function Students() {
 const students = usePeople("students");
  const state = useBatches();
  const courses = useCourses();
  const [filters, setFilters] = useState<Record<string, LegacyValue>>({ search: "", status: "", course: "", batch: "", joined: "" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<LegacyValue>(null);
  const dialog = useRef<LegacyValue>(null);
  const rows = students.map((student: LegacyValue) => {
    const matching = state.enrollments.filter((item: LegacyValue) => item.studentId === student.id && item.course === student.course);
    const enrollment = matching.find((item: LegacyValue) => item.status !== "Completed") || matching[0];
    const course = courses.find((item: LegacyValue) => item.title === student.course);
    return { ...student, batch: enrollment?.batch || student.batch, payment: enrollment?.payment || "Not recorded", joined: enrollment?.enrollmentDate || "Not recorded", category: course?.category || "Course", joinedMonth: enrollment?.enrollmentDate ? new Date(enrollment.enrollmentDate).toISOString().slice(0, 7) : "" };
  });
  const visible = rows.filter((row: LegacyValue) => `${row.name} ${row.email} ${row.id}`.toLowerCase().includes(filters.search.trim().toLowerCase()) && (!filters.status || row.status === filters.status) && (!filters.course || row.course === filters.course) && (!filters.batch || row.batch === filters.batch) && (!filters.joined || row.joinedMonth === filters.joined));
  const pages = Math.max(1, Math.ceil(visible.length / 10));
  const current = Math.min(page, pages);
  const shown = visible.slice((current - 1) * 10, current * 10);
  const month = new Date().toISOString().slice(0, 7);
  const stats = [["Total Students", rows.length, "users"], ["Active Students", rows.filter((row: LegacyValue) => row.status === "Active").length, "cap"], ["New This Month", rows.filter((row: LegacyValue) => row.joinedMonth === month).length, "users"], ["Completed Courses", rows.filter((row: LegacyValue) => row.progress === 100).length, "award"], ["On Hold", rows.filter((row: LegacyValue) => row.status === "On Hold").length, "clock"], ["Inactive", rows.filter((row: LegacyValue) => row.status === "Inactive").length, "target"]];
  function change(key: LegacyValue, value: LegacyValue) { setFilters((previous: LegacyValue) => ({ ...previous, [key]: value })); setPage(1); }
  function reset() { setFilters({ search: "", status: "", course: "", batch: "", joined: "" }); setPage(1); }
  function view(row: LegacyValue) { setSelected(row); dialog.current.showModal(); }
  function exportRows() {
    const columns = ["name", "email", "id", "course", "batch", "progress", "payment", "status", "joined"];
    const cell = (value: LegacyValue) => '"' + String(value ?? "").replace(/^[=+@-]/, (match: LegacyValue) => "'" + match).replaceAll('"', '""') + '"';
    const csv = [columns, ...visible.map((row: LegacyValue) => columns.map((key: LegacyValue) => row[key]))].map((row: LegacyValue) => row.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "learnova-students.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="admin-students"><PeopleManager kind="students"/>
    <header className="as-banner"><div><h1>Students</h1><p>Manage and monitor all student accounts, enrollments, and progress.</p></div><div className="as-banner-art"><span>“A good education can change anyone.<br />A good teacher can change everything.”<small>— Unknown</small></span><PublicIcon name="cap" /></div></header>
    <div className="as-stats">{stats.map(([label, value, icon]: LegacyValue, index: LegacyValue) => <article key={label} className={`as-tone-${index}`}><span className="as-stat-icon"><PublicIcon name={icon} /></span><div><strong>{value}</strong><span>{label}</span><small>{index === 2 ? "Current month" : "Student account overview"}</small></div></article>)}</div>
    <div className="as-tools"><label className="as-search"><PublicIcon name="search" /><input aria-label="Search students" placeholder="Search students by name, email, or ID..." value={filters.search} onChange={(event: LegacyValue) => change("search", event.target.value)} /></label>
      {[["status", "All Statuses"], ["course", "All Courses"], ["batch", "All Batches"], ["joined", "Joined Date"]].map(([key, label]: LegacyValue) => <select key={key} aria-label={label} value={filters[key]} onChange={(event: LegacyValue) => change(key, event.target.value)}><option value="">{label}</option>{[...new Set(rows.map((row: LegacyValue) => row[key === "joined" ? "joinedMonth" : key]).filter(Boolean))].sort().map((value: LegacyValue) => <option key={value}>{value}</option>)}</select>)}
      <button onClick={reset}>Reset</button><button className="as-export" onClick={exportRows}><PublicIcon name="database" />Export</button>
    </div>
    <div className="as-table-wrap" tabIndex={"0" as unknown as number} aria-label="Student records"><table><thead><tr>{["#", "Student", "Student ID", "Enrolled Course", "Batch", "Progress", "Payment Status", "Status", "Joined Date", "Actions"].map((label: LegacyValue) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{shown.map((row: LegacyValue, index: LegacyValue) => <tr key={row.id}>
      <td>{(current - 1) * 10 + index + 1}</td><td><div className="as-student"><span className="as-avatar">{row.image ? <img src={row.image} alt={row.name} /> : row.name.split(" ").map((part: LegacyValue) => part[0]).slice(0,2).join("")}</span><div><strong>{row.name}</strong><small>{row.email}</small></div></div></td>
      <td>{row.id}</td><td><div className={`as-course as-tone-${index % 6}`}><span><PublicIcon name={row.category === "Design" ? "design" : "code"} /></span><div><strong>{row.course}</strong><small>{row.category}</small></div></div></td><td>{row.batch}</td>
      <td><div className={`as-progress as-progress-${index % 3}`}><progress max="100" value={row.progress} aria-label={`${row.name} course progress`} /><span>{row.progress}%</span></div></td>
      <td><span className={`as-badge ${row.payment === "Paid" ? "as-good" : row.payment === "Pending" ? "as-pending" : "as-neutral"}`}><PublicIcon name={row.payment === "Paid" ? "check" : "clock"} />{row.payment}</span></td>
      <td><span className={`as-badge ${["Active", "Completed"].includes(row.status) ? "as-good" : row.status === "Inactive" ? "as-inactive" : "as-neutral"}`}><PublicIcon name={row.status === "Active" ? "check" : "clock"} />{row.status}</span></td><td>{row.joined}</td><td><button className="as-view" aria-label={`View ${row.name}`} onClick={() => view(row)}>⋮</button></td>
    </tr>)}{!shown.length && <tr><td colSpan={"10" as unknown as number} className="as-empty">No students match these filters.</td></tr>}</tbody></table></div>
    <footer className="as-pagination"><span role="status">Showing {visible.length ? (current - 1) * 10 + 1 : 0} to {Math.min(current * 10, visible.length)} of {visible.length} students</span><nav aria-label="Student pages"><button disabled={current === 1} aria-label="Previous page" onClick={() => setPage(current - 1)}>‹</button>{Array.from({ length: pages }, (_: LegacyValue, index: LegacyValue) => <button key={index} aria-current={current === index + 1 ? "page" : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button disabled={current === pages} aria-label="Next page" onClick={() => setPage(current + 1)}>›</button></nav></footer>
    <dialog ref={dialog} className="as-details" aria-labelledby="as-detail-title"><h2 id="as-detail-title">Student Details</h2>{selected && <dl>{[["Name", selected.name], ["Email", selected.email], ["Student ID", selected.id], ["Enrolled Course", selected.course], ["Batch", selected.batch], ["Progress", `${selected.progress}%`], ["Payment Status", selected.payment], ["Status", selected.status], ["Joined Date", selected.joined]].map(([label,value]: LegacyValue) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}<form method="dialog"><button>Close</button></form></dialog>
  </div>;
}
