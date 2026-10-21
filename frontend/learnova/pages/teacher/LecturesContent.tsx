import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import useBatches from "../../utils/useBatches";
import { teacherId, teacherBatches } from "../../utils/batchStorage";
import PublicIcon from "../../components/PublicIcon";
import SuperAdminRecords from "../../components/SuperAdminRecords";

const columns = [["title","Lecture Title",(row: LegacyValue)=><div className="tl-title"><PublicIcon name="book"/><div><strong>{row.title}</strong><small>{row.duration || "Duration not recorded"}</small></div></div>],["course","Course",(row: LegacyValue)=><div>{row.course}<small>{row.batch}</small></div>],["module","Module"],["type","Type"],["status","Status",(row: LegacyValue)=><span className="tl-status" data-status={row.status}>{row.status}</span>]];
export default function LecturesContent() {
  const state = useBatches();
  const batches = teacherBatches(state);
  const lectures = state.materials.filter((item: LegacyValue)=>item.type!=="Recording / Notes" && item.teacherId===teacherId && batches.some((batch: LegacyValue)=>batch.id===item.batchId && batch.courseId===item.courseId));
  const [tab,setTab] = useState("");
  const rows = lectures.filter((item: LegacyValue)=>!tab || item.status===tab);
  const stats = [[lectures.length,"Total Lectures","book"],[lectures.filter((item: LegacyValue)=>item.status==="Published").length,"Published","play"],[lectures.filter((item: LegacyValue)=>item.status==="Draft").length,"Drafts","clock"],[new Set(lectures.filter((item: LegacyValue)=>item.module).map((item: LegacyValue)=>`${item.courseId}:${item.module}`)).size,"Modules","layers"]];
  return <section className="teacher-content-page"><header className="tl-heading"><h1>Lectures &amp; Content</h1><p>View your course lectures, notes, and learning materials.</p></header><div className="tl-stats">{stats.map(([value,label,icon]: LegacyValue)=><article key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <section className="tl-panel"><nav aria-label="Lecture status">{[["","All Lectures"],["Published","Published"],["Draft","Drafts"]].map(([value,label]: LegacyValue)=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</nav><SuperAdminRecords title="Lectures" heading={<span className="tl-caption">Lectures in your assigned batches</span>} rows={rows} columns={columns} filters={[["course","Courses"]]} paginate/></section>
  </section>;
}
