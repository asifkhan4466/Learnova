import type { LegacyValue } from "../../../lib/legacy-types";
import useBatches from "../../utils/useBatches";
import { teacherStudents } from "../../utils/batchStorage";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import PublicIcon from "../../components/PublicIcon";

const columns = [["name","Student",(student: LegacyValue)=><div className="ts-person"><span>{student.name.charAt(0)}</span><div><strong>{student.name}</strong><small>{student.email}</small></div></div>],["course","Course"],["batch","Batch"],["progress","Progress",(student: LegacyValue)=><div className="ts-progress"><progress value={student.progress} max="100" aria-label={`${student.name} progress`}/><span>{student.progress}%</span></div>],["status","Status",(student: LegacyValue)=><span className="ts-status">{student.status}</span>]];
export default function Students() {
  const students = teacherStudents(useBatches());
  const count = (rows: LegacyValue) => new Set(rows.map((student: LegacyValue)=>student.studentId)).size;
  const stats = [[count(students),"Total Students","Across assigned batches","users"],[count(students.filter((student: LegacyValue)=>student.status==="Active")),"Active Students","Currently enrolled","users"],[count(students.filter((student: LegacyValue)=>student.status==="Completed")),"Completed","Completed enrollments","check"],[new Set(students.map((student: LegacyValue)=>student.batchId)).size,"Student Batches","With approved enrollments","layers"]];
  return <section className="teacher-students-page"><header className="ts-heading"><h1>Students</h1><p>View your students across assigned courses and batches.</p></header><div className="ts-stats">{stats.map(([value,label,note,icon]: LegacyValue)=><article key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p><small>{note}</small></div></article>)}</div><section className="ts-panel"><SuperAdminRecords title="Students" heading={<span className="ts-caption">Approved students in your assigned batches</span>} rows={students} columns={columns} filters={[["course","Courses"],["batch","Batches"]]} paginate/></section></section>;
}
