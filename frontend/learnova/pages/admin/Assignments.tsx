import type { LegacyValue } from "../../../lib/legacy-types";
import { assignments as rows } from "../../data/operations";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";

const columns = [["title", "Assignment"], ["course", "Course"], ["batch", "Batch"], ["teacher", "Teacher"], ["dueDate", "Due Date"], ["submissions", "Submissions", (r: LegacyValue) => <div>{r.submissions} / {r.totalStudents}<progress aria-label="Submission progress" value={r.submissions} max={Math.max(1,r.totalStudents)}/></div>], ["status", "Status", (r: LegacyValue) => <span className="sa-status" data-status={r.status}>{r.status}</span>]];
export default function Assignments() {
  
  return <div className="sa-page sa-record-page"><SuperAdminRecords paginate filters={[["course","Courses"],["batch","Batches"]]} title="Assignments" heading={<AdminHeading title="Assignments" subtitle="Manage assignments and monitor student submissions." icon="design"/>} rows={rows} columns={columns}><AdminSummary items={[["Total Assignments",rows.length,"design"],["Active",rows.filter((r: LegacyValue)=>r.status==="Active").length,"clock"],["Completed",rows.filter((r: LegacyValue)=>r.status==="Completed").length,"check"],["Submissions",rows.reduce((n: LegacyValue,r: LegacyValue)=>n+r.submissions,0),"book"]]}/></SuperAdminRecords></div>;
}
