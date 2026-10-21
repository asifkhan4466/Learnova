import type { LegacyValue } from "../../../lib/legacy-types";
import { useRef, useState } from "react";
import PublicIcon from "../../components/PublicIcon";
import useBatches from "../../utils/useBatches";
import { teacherBatches, teacherStudents } from "../../utils/batchStorage";

export default function MyBatches() {
  const state = useBatches();
  const batches = teacherBatches(state);
  const students = teacherStudents(state);
  const [search,setSearch] = useState("");
  const [status,setStatus] = useState("");
  const [selected,setSelected] = useState<LegacyValue>(null);
  const [showStudents,setShowStudents] = useState(false);
  const dialog = useRef<LegacyValue>(null);
  const statuses = ["Active","Upcoming","Completed"];
  const visible = batches.filter((batch: LegacyValue)=>(!status || batch.status===status) && `${batch.name} ${batch.course}`.toLowerCase().includes(search.trim().toLowerCase()));
  const roster = (batch: LegacyValue) => students.filter((student: LegacyValue)=>student.batchId===batch.id && student.courseId===batch.courseId);
  function open(batch: LegacyValue, studentsOnly: LegacyValue=false){setSelected(batch);setShowStudents(studentsOnly);dialog.current.showModal();}
  return <section className="tmb-page"><header><h1>My Batches</h1><p>View and manage the batches assigned to you.</p></header>
    <div className="tmb-stats">{[...statuses.map((status: LegacyValue,index: LegacyValue)=>[batches.filter((batch: LegacyValue)=>batch.status===status).length,`${status} Batches`,["layers","clock","check"][index]]),[new Set(students.map((student: LegacyValue)=>student.studentId)).size,"Total Students","users"]].map(([value,label,icon]: LegacyValue)=><article key={label}><span className="tmb-icon"><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <div className="tmb-toolbar"><nav aria-label="Batch status"><button aria-pressed={!status} onClick={()=>setStatus("")}>All Batches</button>{statuses.map((value: LegacyValue)=><button key={value} aria-pressed={status===value} onClick={()=>setStatus(value)}>{value} ({batches.filter((batch: LegacyValue)=>batch.status===value).length})</button>)}</nav><input aria-label="Search batches" placeholder="Search batches by name or course..." value={search} onChange={(e: LegacyValue)=>setSearch(e.target.value)}/></div>
    <div className="tmb-list">{visible.map((batch: LegacyValue)=><article key={batch.id}><span className="tmb-icon"><PublicIcon name="book"/></span><div className="tmb-info"><h2>{batch.course} - {batch.name}</h2><p>{batch.teacher}</p><small><PublicIcon name="calendar"/>{batch.startDate} - {batch.endDate}</small></div><div className="tmb-count"><PublicIcon name="users"/><div><strong>{roster(batch).length}</strong><small>Students</small></div></div><span className="tmb-status" data-status={batch.status}>{batch.status}</span><div className="tmb-actions"><button onClick={()=>open(batch,true)}>View Students</button><button className="tmb-primary" onClick={()=>open(batch)}>View Batch</button></div></article>)}{!visible.length && <p className="tmb-empty">No matching assigned batches.</p>}</div><footer>Showing {visible.length} of {batches.length} batches</footer>
    <dialog ref={dialog} aria-labelledby="tmb-title"><h2 id="tmb-title">{selected?.name} {showStudents ? "Students" : "Details"}</h2>{selected && <><p>{selected.course}</p>{!showStudents && <dl>{[["Teacher",selected.teacher],["Status",selected.status],["Start Date",selected.startDate],["End Date",selected.endDate]].map(([label,value]: LegacyValue)=><div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl>}<h3>Enrolled Students ({roster(selected).length})</h3>{roster(selected).length ? <ul>{roster(selected).map((student: LegacyValue)=><li key={student.id}>{student.name} <small>{student.email}</small></li>)}</ul> : <p>No approved students assigned to this batch.</p>}</>}<form method="dialog"><button>Close</button></form></dialog>
  </section>;
}
