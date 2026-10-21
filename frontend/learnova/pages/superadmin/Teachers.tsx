import type { LegacyValue } from "../../../lib/legacy-types";
import { updateTeacher, deleteTeacher } from "../../utils/teacherManagement";
import { readProfileImage } from "../../utils/profileStorage";
import PeopleManager from "../../components/PeopleManager";

import { useRef, useState } from "react";
import { usePeople } from "../../utils/peopleStorage";
import useCourses from "../../utils/useCourses";
import useBatches from "../../utils/useBatches";
import PublicIcon from "../../components/PublicIcon";

export default function Teachers() {
 const teachers = usePeople("teachers");
  const courses = useCourses();
  const state = useBatches();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<LegacyValue>(null);
  const dialog = useRef<LegacyValue>(null);
  const editDialog = useRef<LegacyValue>(null);
  const [draft, setDraft] = useState<LegacyValue>(null);
  const [originalId, setOriginalId] = useState("");
  const [message, setMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [uploading, setUploading] = useState(false);
  function edit(teacher: LegacyValue) {
    setOriginalId(teacher.id); setDraft({ ...teacher }); setEditError(""); editDialog.current.showModal();
  }
  function save(event: LegacyValue) {
    event.preventDefault();
    try { updateTeacher(originalId, draft); editDialog.current.close(); setMessage("Teacher updated successfully."); }
    catch (error: LegacyValue) { setEditError(error.message); }
  }
  function remove(teacher: LegacyValue) {
    if (!window.confirm(`Delete ${teacher.name} (${teacher.id})? Their courses and batches will be kept but unassigned. This cannot be undone.`)) return;
    try { deleteTeacher(teacher.id); setMessage("Teacher deleted. Their courses and batches are now unassigned."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  async function upload(event: LegacyValue) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setEditError("");
    try { const image = await readProfileImage(file); setDraft((value: LegacyValue) => value ? { ...value, image } : value); }
    catch (error: LegacyValue) { setEditError(error.message); }
    finally { setUploading(false); }
  }
  const rows = teachers.filter((teacher: LegacyValue) => `${teacher.name} ${teacher.email} ${teacher.id} ${teacher.specialization}`.toLowerCase().includes(search.toLowerCase()) && (!status || teacher.status === status));
  const live = state.classes.filter((item: LegacyValue) => item.status === "Live" && state.batches.some((batch: LegacyValue) => batch.id === item.batchId && batch.status === "Active")).length;
  const stats = [["Total Teachers", teachers.length, "users", 2], ["Active Instructors", teachers.filter((item: LegacyValue) => item.status === "Active").length, "users", 1], ["Live Now", live, "video", 0], ["Pending Assignments", courses.filter((item: LegacyValue) => !item.instructor).length, "clock", 5]];
  function view(teacher: LegacyValue) { setSelected(teacher); dialog.current.showModal(); }
  return <div className="admin-teachers"><PeopleManager kind="teachers"/>
    <header className="as-banner"><div><h1>Teachers</h1><p>Manage your instructors, view their performance, and assigned courses.</p></div><div className="as-banner-art"><span>“Great teachers inspire<br />great learners.”<small>— Unknown</small></span><PublicIcon name="cap" /></div></header>
    <div className="as-stats">{stats.map(([label,value,icon,tone]: LegacyValue) => <article key={label} className={`as-tone-${tone}`}><span className="as-stat-icon"><PublicIcon name={icon} /></span><div><strong>{value}</strong><span>{label}</span><small>Platform overview</small></div></article>)}</div>
    <section className="at-panel"><div className="at-heading"><div><h2>All Teachers</h2><p>View and manage all instructors on your platform.</p></div><label className="as-search"><PublicIcon name="search" /><input aria-label="Search teachers" placeholder="Search teachers by name, email or subject..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)} /></label><button onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>Filter</button></div>
      {filtersOpen && <div className="at-filter"><label>Status <select value={status} onChange={(event: LegacyValue) => setStatus(event.target.value)}><option value="">All Statuses</option>{[...new Set(teachers.map((item: LegacyValue) => item.status))].map((value: LegacyValue) => <option key={value}>{value}</option>)}</select></label><button onClick={() => { setSearch(""); setStatus(""); }}>Reset</button></div>}
      {message && <p role="status">{message}</p>}
      <div className="as-table-wrap"><table><thead><tr>{["Teacher", "Specialization", "Assigned Courses", "Live Classes", "Rating", "Status", "Joined Date", "Actions"].map((label: LegacyValue) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((teacher: LegacyValue) => {
        const assigned = courses.filter((course: LegacyValue) => course.instructorId === teacher.id || (!course.instructorId && course.instructor === teacher.name));
        const rated = assigned.filter((course: LegacyValue) => course.rating > 0);
        const rating = rated.length ? (rated.reduce((total: LegacyValue,course: LegacyValue) => total + course.rating,0)/rated.length).toFixed(1) : "Not rated";
        return <tr key={teacher.id}><td><div className="as-student"><span className="as-avatar">{teacher.image ? <img src={teacher.image} alt={teacher.name} /> : teacher.name.split(" ").map((part: LegacyValue) => part[0]).join("")}</span><div><strong>{teacher.name}</strong><small>{teacher.email}</small></div></div></td><td>{teacher.specialization}</td><td><div className="at-tags">{assigned.slice(0,2).map((course: LegacyValue) => <span key={course.id}>{course.title}</span>)}{assigned.length > 2 && <span>+{assigned.length-2}</span>}{!assigned.length && <span>{teacher.courses} assigned</span>}</div></td><td>{state.classes.filter((item: LegacyValue) => item.teacherId === teacher.id).length}</td><td><span className="at-rating"><PublicIcon name="star" />{rating}</span><small>Course ratings</small></td><td><span className={`as-badge ${teacher.status === "Active" ? "as-good" : "as-neutral"}`}>● {teacher.status}</span></td><td>{teacher.joinedDate || "Not recorded"}</td><td><div className="at-actions"><button className="at-view" onClick={() => view(teacher)}>View</button><button aria-label={`Edit ${teacher.name}`} onClick={() => edit(teacher)}>Edit</button><button className="at-delete" aria-label={`Delete ${teacher.name}`} onClick={() => remove(teacher)}>Delete</button></div></td></tr>;
      })}{!rows.length && <tr><td colSpan={"8" as unknown as number} className="as-empty">No matching teachers.</td></tr>}</tbody></table></div>
      <footer className="as-pagination"><span>Showing {rows.length} of {teachers.length} teachers</span><nav aria-label="Teacher pages"><button disabled aria-label="Previous page">‹</button><button aria-current="page">1</button><button disabled aria-label="Next page">›</button></nav></footer>
    </section>
    <dialog ref={editDialog} className="as-details at-edit-dialog" aria-labelledby="teacher-edit-title" onClose={()=>setDraft(null)} onCancel={(event: LegacyValue)=>{if(uploading) event.preventDefault();}}>
      <h2 id="teacher-edit-title">Edit Teacher</h2>
      {draft && <form onSubmit={save}>
        <fieldset disabled={uploading} className="at-edit-fields">
          {[ ["id","Teacher ID"], ["name","Full Name"], ["email","Email Address"], ["username","Username"], ["phone","Phone Number"], ["specialization","Specialization"], ["experience","Experience"], ["joinedDate","Joined Date"] ].map(([key,label]: LegacyValue) => <label key={key}>{label}<input name={key} type={key === "email" ? "email" : key === "joinedDate" ? "date" : "text"} value={draft[key] || ""} required={["id","name","email"].includes(key)} onChange={(event: LegacyValue)=>setDraft({...draft,[key]:event.target.value})} /></label>)}
          <label>Status<select value={draft.status} onChange={(event: LegacyValue)=>setDraft({...draft,status:event.target.value})}><option>Active</option><option>Inactive</option></select></label>
          <label>Bio<textarea rows={3} value={draft.bio || ""} onChange={(event: LegacyValue)=>setDraft({...draft,bio:event.target.value})} /></label>
          <label>Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label>
          {draft.image && <div><img className="at-photo-preview" src={draft.image} alt="Teacher profile preview" /><button type="button" onClick={()=>setDraft({...draft,image:""})}>Remove Photo</button></div>}
        </fieldset>
        <p className="at-edit-note">Course assignments, live classes and ratings come from their linked records. Changing the teacher ID or name keeps those links.</p>
        {editError && <p role="alert" className="at-edit-error">{editError}</p>}
        <footer className="at-edit-footer"><button type="button" disabled={uploading} onClick={()=>editDialog.current.close()}>Cancel</button><button className="at-save" type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Save Changes"}</button></footer>
      </form>}
    </dialog>
    <dialog ref={dialog} className="as-details" aria-labelledby="teacher-detail-title"><h2 id="teacher-detail-title">Teacher Details</h2>{selected && <dl>{[["Name",selected.name],["User ID",selected.id],["Email",selected.email],["Specialization",selected.specialization],["Assigned Courses",selected.courses],["Status",selected.status]].map(([label,value]: LegacyValue) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}<form method="dialog"><button>Close</button></form></dialog>
  </div>;
}
