import type { LegacyValue } from "../../../lib/legacy-types";
import EnrollmentGroups from "../../components/EnrollmentGroups";
import useBatches from "../../utils/useBatches";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";


const columns = [["student", "Student"], ["studentId", "Student ID"], ["course", "Course"], ["batch", "Batch"], ["payment", "Payment"], ["enrollmentDate", "Enrollment Date"], ["status", "Status", (row: LegacyValue) => <span className="sa-status" data-status={row.status}>{row.status}</span>]];
export default function Enrollments() {
  const { enrollments: rows } = useBatches();
  return <div className="sa-record-page"><SuperAdminRecords paginate filters={[["course","Courses"],["batch","Batches"]]} title="Enrollments" subtitle="Manage student course enrollments, batch assignments, and access status." heading={<AdminHeading title="Enrollments" subtitle="Manage student course enrollments, batch assignments, and access status." icon="cap"/>} rows={rows} columns={columns}>
    <AdminSummary items={[["Total Enrollments", rows.length, "users"], ["Active", rows.filter((r: LegacyValue) => r.status === "Active").length, "check"], ["Pending", rows.filter((r: LegacyValue) => r.status === "Pending").length, "clock"], ["Completed", rows.filter((r: LegacyValue) => r.status === "Completed").length, "cap"]]}/>
  </SuperAdminRecords><EnrollmentGroups role="subadmin" batchesOnly={false}/></div>;
}
