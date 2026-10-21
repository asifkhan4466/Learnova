import type { LegacyValue } from "../../../lib/legacy-types";
import { useNavigate } from "@/lib/navigation";
import { classStatus } from "../../utils/batchStorage";
import useBatches from "../../utils/useBatches";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import LiveNowPanel from "../../components/LiveNowPanel";

import ScheduleLiveClass from "../../components/ScheduleLiveClass";
import PublicIcon from "../../components/PublicIcon";

const columns = [["title", "Class"], ["course", "Course"], ["batch", "Batch"], ["teacher", "Teacher"], ["date", "Date"], ["time", "Time"], ["duration", "Duration"], ["students", "Students"], ["status", "Status", (row: LegacyValue) => <span className="sa-status" data-status={row.status}>{row.status === "Live" ? "LIVE" : row.status}</span>]];

export default function LiveClasses() {
  const state = useBatches();
  const navigate = useNavigate();
  const classes = state.classes.map((item: LegacyValue) => ({ ...item, status: classStatus(item, state) }));
  const stats = [["Live Now", classes.filter((item: LegacyValue) => item.status === "Live").length, "video"], ["Scheduled", classes.filter((item: LegacyValue) => item.status === "Scheduled").length, "clock"], ["Completed", classes.filter((item: LegacyValue) => item.status === "Completed").length, "check"], ["Total Classes", classes.length, "users"]];
  return <section className="admin-live-classes"><header className="alv-banner"><div><h1>Live Classes</h1><p>Manage and monitor live classes and keep every session connected to its assigned batch.</p></div><ScheduleLiveClass state={state}/><blockquote>&ldquo;Live learning today,<br/>brighter minds tomorrow.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="video"/><PublicIcon name="cap"/></header><div className="alv-stats">{stats.map(([label, value, icon]: LegacyValue, index: LegacyValue) => <article className={`alv-tone-${index}`} key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p><small>Shared batch schedule</small></div></article>)}</div><LiveNowPanel classes={classes.filter((item: LegacyValue) => item.status === "Live")} routePrefix="/superadmin/live-classes"/><div className="alv-columns"><SuperAdminRecords title="All Classes" subtitle="Review scheduled live classes and participating batches." filters={[["course", "Courses"], ["batch", "Batches"], ["teacher", "Teachers"]]} viewAction={(row: LegacyValue) => navigate(`/superadmin/live-classes/${row.id}`)} viewLabel={(row: LegacyValue) => row.status === "Live" ? "Monitor Live" : "View"} rows={classes} columns={columns}/><aside><section className="alv-panel"><PublicIcon name="users"/><h2>Current Batch Access</h2><p>Live classes are available to approved, active enrollments in the assigned active batch only.</p><ul><li>Course and batch assignment must match.</li><li>Upcoming batches require Super Admin activation.</li><li>Completed batches do not expose live access.</li></ul></section><section className="alv-panel"><PublicIcon name="check"/><h2>Class Access Checklist</h2><ul><li>Teacher assigned to the course and batch</li><li>Class scheduled for the assigned batch</li><li>Student enrollment approved</li><li>Batch activated by Super Admin</li></ul></section><section className="alv-panel"><PublicIcon name="book"/><h2>Recordings &amp; Materials</h2><p>Completed batch materials remain available to its students. Late enrollments can access previous materials from their assigned batch.</p></section></aside></div></section>;
}
