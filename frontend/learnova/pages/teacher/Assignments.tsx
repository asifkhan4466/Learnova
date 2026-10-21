import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { assignments } from "../../data/operations";
import useBatches from "../../utils/useBatches";
import { teacherBatches } from "../../utils/batchStorage";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import PublicIcon from "../../components/PublicIcon";

const columns = [["title","Assignment Title"],["course","Course",(row: LegacyValue)=><div>{row.course}<small>{row.batch}</small></div>],["dueDate","Due Date"],["submissions","Submissions",(row: LegacyValue)=>`${row.submissions} / ${row.totalStudents}`],["progress","Progress",(row: LegacyValue)=><div className="ta-progress"><strong>{row.progress}%</strong><progress value={row.progress} max="100" aria-label={`${row.title} submissions`}/></div>],["status","Status",(row: LegacyValue)=><span className="ta-status">{row.status}</span>]];
export default function Assignments() {
  const batches = teacherBatches(useBatches());
  const rows = assignments.filter((item: LegacyValue)=>batches.some((batch: LegacyValue)=>batch.course===item.course && batch.name===item.batch && batch.teacher===item.teacher)).map((item: LegacyValue)=>({...item,progress:item.totalStudents ? Math.round(item.submissions/item.totalStudents*100) : 0}));
  const [tab,setTab] = useState("");
  const stats = [[rows.length,"Total Assignments","book"],[rows.reduce((sum: LegacyValue,row: LegacyValue)=>sum+row.submissions,0),"Total Submissions","users"],[rows.filter((row: LegacyValue)=>row.status==="Completed").length,"Completed","check"],[rows.filter((row: LegacyValue)=>row.status==="Active").length,"Active Assignments","clock"]];
  return <section className="teacher-assignments-page"><header className="ta-heading"><h1>Assignments</h1><p>View assignments and track submissions across your assigned courses and batches.</p></header><div className="ta-stats">{stats.map(([value,label,icon]: LegacyValue)=><article key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div><section className="ta-panel"><nav aria-label="Assignment status">{[["","All Assignments"],["Active","Active"],["Completed","Completed"]].map(([value,label]: LegacyValue)=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</nav><SuperAdminRecords title="Assignments" heading={<span className="ta-caption">Assignments for your batches</span>} rows={rows.filter((row: LegacyValue)=>!tab || row.status===tab)} columns={columns} filters={[["course","Courses"]]} paginate/></section></section>;
}
