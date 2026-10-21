import type { LegacyValue } from "../../../lib/legacy-types";
import { content as rows } from "../../data/operations";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";


const columns = [["title", "Content"], ["course", "Course"], ["batch", "Batch"], ["teacher", "Teacher"], ["type", "Type"], ["module", "Module"], ["materials", "Materials"], ["status", "Status", (row: LegacyValue) => <span className="sa-status" data-status={row.status}>{row.status}</span>]];
export default function LecturesContent() {
  
  return <div className="sa-record-page"><SuperAdminRecords paginate filters={[["course","Courses"],["type","Types"]]} title="Course & Content" subtitle="Manage lectures, modules, recordings, notes, and learning materials." heading={<AdminHeading title="Course & Content" subtitle="Manage lectures, modules, recordings, notes, and learning materials." icon="book"/>} rows={rows} columns={columns}>
    <AdminSummary items={[["Total Content", rows.length, "book"], ["Published", rows.filter((r: LegacyValue) => r.status === "Published").length, "check"], ["Drafts", rows.filter((r: LegacyValue) => r.status === "Draft").length, "design"], ["Materials", rows.reduce((sum: LegacyValue,r: LegacyValue) => sum + Number(r.materials || 0),0), "database"]]}/>
  </SuperAdminRecords></div>;
}
