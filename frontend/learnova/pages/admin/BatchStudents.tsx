import type { LegacyValue } from "../../../lib/legacy-types";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { subscribe } from "../../utils/useProfile";
import { batchStudents, deleteStudent, updateStudentProfile } from "../../utils/studentDirectory";
import { readProfileImage } from "../../utils/profileStorage";

const fields = [["name", "Full Name"], ["email", "Email"], ["username", "Username"], ["phone", "Phone"], ["specialization", "Specialization"], ["experience", "Experience"], ["bio", "Bio"]];
const value = (item: LegacyValue) => item === undefined || item === null || item === "" ? "Not provided" : String(item);
export default function BatchStudents({ batch, state, onClose }: LegacyValue) {
  const dialog = useRef<LegacyValue>(null), pointerOutside = useRef(false);
  const [studentId, setStudentId] = useState<LegacyValue>(null), [draft, setDraft] = useState<LegacyValue>(null), [error, setError] = useState(""), [uploading, setUploading] = useState(false);
  const rows = JSON.parse(useSyncExternalStore(subscribe, () => JSON.stringify(batchStudents(batch, state.enrollments))));
  const student = rows.find((row: LegacyValue) => row.id === studentId);
  useEffect(() => { if (batch) dialog.current.showModal(); }, [batch]);
  function close() { dialog.current.close(); setStudentId(null); setDraft(null); setError(""); onClose(); }
  function outside(event: LegacyValue) { const r = event.currentTarget.getBoundingClientRect(); return event.target === event.currentTarget && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom); }
  function remove() {
    if (!window.confirm(`Delete ${student.name}? This removes the student from the student directory and all batch lists in this browser. Historical enrollment and payment records are retained.`)) return;
    try { deleteStudent(student.id, "subadmin"); setStudentId(null); setDraft(null); setError(""); } catch (err: LegacyValue) { setError(err.message); }
  }
  function save(event: LegacyValue) {
    event.preventDefault();
    try { updateStudentProfile(student.id, draft, "subadmin"); setDraft(null); setError(""); } catch (err: LegacyValue) { setError(err.message); }
  }
  return <dialog className="sab-student-dialog" ref={dialog} aria-labelledby="sab-students-title" onCancel={(event: LegacyValue) => { event.preventDefault(); if (!uploading) close(); }} onPointerDown={(event: LegacyValue) => { pointerOutside.current = outside(event); }} onClick={(event: LegacyValue) => { if (!uploading && pointerOutside.current && outside(event)) close(); pointerOutside.current = false; }}>
    <h2 id="sab-students-title">{draft ? "Edit Student" : student ? "Student Details" : `${batch?.name || "Batch"} Students`}</h2>
    <p>{batch?.course} &middot; {batch?.name}</p>
    {error && <p role="alert" className="sab-error">{error}</p>}
    {!student ? <><p>{rows.length} students assigned to this batch</p><div className="sab-table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((row: LegacyValue) => <tr key={row.id}><td><button onClick={() => { setStudentId(row.id); setError(""); }}>{row.name}</button></td><td>{row.id}</td><td>{value(row.email)}</td><td>{value(row.enrollments[0]?.status || row.status)}</td><td><button onClick={() => setStudentId(row.id)}>View student</button></td></tr>)}</tbody></table></div>{!rows.length && <p>No student records are assigned to this batch.</p>}<footer><button onClick={close}>Close</button></footer></> : draft ? <form onSubmit={save}><fieldset className="sab-form" disabled={uploading}>{fields.map(([key, label]: LegacyValue) => <label key={key}>{label}<input type={key === "email" ? "email" : "text"} required={["name", "email"].includes(key)} value={draft[key] || ""} onChange={(event: LegacyValue) => setDraft({ ...draft, [key]: event.target.value })}/></label>)}<label>Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event: LegacyValue) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); try { const image = await readProfileImage(file); setDraft((row: LegacyValue) => ({ ...row, image })); } catch (err: LegacyValue) { setError(err.message); } finally { setUploading(false); } }}/></label></fieldset><footer><button type="button" disabled={uploading} onClick={() => { setDraft(null); setError(""); }}>Cancel</button><button className="sab-primary" disabled={uploading}>{uploading ? "Uploading..." : "Save Student"}</button></footer></form> : <>
      {student.image && <img className="sab-student-photo" src={student.image} alt={student.name}/>}
      <dl className="sab-student-data">{[["id", "Student ID"], ...fields, ["status", "Status"], ["progress", "Progress (%)"], ["joinedDate", "Join Date"]].map(([key, label]: LegacyValue) => <div key={key}><dt>{label}</dt><dd>{value(student[key])}</dd></div>)}</dl>
      <h3>Enrollments</h3>{state.enrollments.filter((row: LegacyValue) => row.studentId === student.id).map((row: LegacyValue) => <dl className="sab-student-data" key={row.id}>{[["course", "Course"], ["batch", "Batch"], ["enrollmentDate", "Enrollment Date"], ["status", "Status"], ["payment", "Payment"], ["approved", "Approved"]].map(([key, label]: LegacyValue) => <div key={key}><dt>{label}</dt><dd>{value(row[key])}</dd></div>)}</dl>)}{!state.enrollments.some((row: LegacyValue) => row.studentId === student.id) && <p>No enrollment records. Assigned to {batch?.name} ({batch?.course}).</p>}
      <h3>Payments</h3>{(state.payments || []).filter((row: LegacyValue) => row.studentId === student.id).map((row: LegacyValue, index: LegacyValue) => <dl className="sab-student-data" key={row.id || index}>{[["course", "Course"], ["amount", "Amount"], ["status", "Status"], ["method", "Method"], ["transactionId", "Transaction ID"], ["date", "Date"]].map(([key, label]: LegacyValue) => <div key={key}><dt>{label}</dt><dd>{value(row[key])}</dd></div>)}</dl>)}{!(state.payments || []).some((row: LegacyValue) => row.studentId === student.id) && <p>No payment records.</p>}
      <footer><button onClick={() => { setStudentId(null); setError(""); }}>Back to students</button><button className="sab-delete" onClick={remove}>Delete Student</button><button className="sab-primary" onClick={() => { setDraft({ ...student }); setError(""); }}>Edit Student</button></footer>
    </>}
  </dialog>;
}
