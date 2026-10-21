import type { LegacyValue } from "../../../lib/legacy-types";
import { useNavigate } from "@/lib/navigation";
import { classStatus } from "../../utils/batchStorage";
import useBatches from "../../utils/useBatches";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import LiveNowPanel from "../../components/LiveNowPanel";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";
import ScheduleLiveClass from "../../components/ScheduleLiveClass";


const columns = [["title", "Class"], ["course", "Course"], ["batch", "Batch"], ["teacher", "Teacher"], ["date", "Date"], ["time", "Time"], ["duration", "Duration"], ["students", "Students"], ["status", "Status", (row: LegacyValue) => <span className="sa-status" data-status={row.status}>{row.status === "Live" ? "LIVE" : row.status}</span>]];

export default function LiveClasses() {
  const state = useBatches();
  const navigate = useNavigate();
  const rows = state.classes.map((item: LegacyValue) => ({ ...item, status: classStatus(item, state) }));
  return <div className="sa-page sa-record-page"><ScheduleLiveClass state={state} role="subadmin"/><LiveNowPanel classes={rows.filter((item: LegacyValue) => item.status === "Live")} routePrefix="/admin/live-classes"/><SuperAdminRecords paginate filters={[["course", "Courses"], ["batch", "Batches"], ["teacher", "Teachers"]]} viewAction={(row: LegacyValue) => navigate(`/admin/live-classes/${row.id}`)} viewLabel={(row: LegacyValue) => row.status === "Live" ? "Monitor Live" : "View"} title="Live Classes" heading={<AdminHeading title="Live Classes" subtitle="Manage scheduled sessions and current batch live classes." icon="video"/>} rows={rows} columns={columns}><AdminSummary items={[["Total Classes", rows.length, "video"], ["Live Now", rows.filter((r: LegacyValue) => r.status === "Live").length, "play"], ["Scheduled", rows.filter((r: LegacyValue) => r.status === "Scheduled").length, "clock"], ["Completed", rows.filter((r: LegacyValue) => r.status === "Completed").length, "check"]]}/></SuperAdminRecords></div>;
}
