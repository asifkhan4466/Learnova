import type { LegacyValue } from "../../../lib/legacy-types";
import { useRef, useState, useSyncExternalStore } from "react";
import { subscribe } from "../../utils/useProfile";
import { saveProfile, readProfileImage } from "../../utils/profileStorage";
import { getStudents } from "../../utils/studentDirectory";
import PublicIcon from "../../components/PublicIcon";


const extraKey = "learnova_admin_student_additions";
function additions() { try { return JSON.parse(localStorage.getItem(extraKey) || "[]"); } catch { return []; } }
const snapshot = () => JSON.stringify(getStudents());
const fields = [["name","Full Name"],["email","Email"],["username","Username"],["phone","Phone"],["specialization","Specialization"],["experience","Experience"],["bio","Bio"]];
function Eye() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>; }
export default function Students() {
 const rows = JSON.parse(useSyncExternalStore(subscribe, snapshot));
 const [search,setSearch]=useState("");
 const [filters,setFilters]=useState<Record<string, LegacyValue>>({});
 const [page,setPage]=useState(1), [size,setSize]=useState(10);
 const [selected,setSelected]=useState<LegacyValue[]>([]), [record,setRecord]=useState<LegacyValue>(null), [mode,setMode]=useState("view");
 const [message,setMessage]=useState(""), [error,setError]=useState(""), [uploading,setUploading]=useState(false);
 const dialog=useRef<LegacyValue>(null);
 const visible=rows.filter((row: LegacyValue) => `${row.name} ${row.email} ${row.id} ${row.username || ""}`.toLowerCase().includes(search.toLowerCase()) && Object.entries(filters).every(([key,value]: LegacyValue) => !value || row[key]===value));
 const pages=Math.max(1,Math.ceil(visible.length/size)), current=Math.min(page,pages), start=(current-1)*size, displayed=visible.slice(start,start+size);
 function open(row: LegacyValue,nextMode: LegacyValue) { setRecord({...row}); setMode(nextMode); setError(""); dialog.current.showModal(); }
 function changeFilter(key: LegacyValue,value: LegacyValue) { setFilters({...filters,[key]:value}); setPage(1); }
 function save(event: LegacyValue) {
  event.preventDefault();
  try {
   if(mode==="add") {
    if(!/^[a-zA-Z0-9_-]{3,40}$/.test(record.id)) throw new Error("Enter a valid student ID (3 to 40 letters, numbers, hyphens or underscores).");
    if(rows.some((row: LegacyValue)=>row.id.toLowerCase()===record.id.toLowerCase() || row.email.toLowerCase()===record.email.toLowerCase())) throw new Error("This student ID or email already exists.");
    if(!record.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) throw new Error("Enter a name and valid email.");
    localStorage.setItem(extraKey,JSON.stringify([...additions(),{...record,status:"Active",progress:0,courses:0,joinedDate:new Date().toISOString().slice(0,10)}]));
    window.dispatchEvent(new Event("learnova:profile-updated"));
   } else saveProfile(record.id,record);
   dialog.current.close(); setMessage(mode==="add" ? "Student added in this browser." : "Student profile saved.");
  } catch(error: LegacyValue) { setError(error.message); }
 }
 function exportRows() {
  const list=selected.length ? visible.filter((row: LegacyValue)=>selected.includes(row.id)) : visible;
  const keys=["id","name","email","batch","status","joinedDate","course","progress"];
  const quote=(value: LegacyValue)=>{ const text=String(value??""); return '"'+(/^[=+@\-\t\r]/.test(text) ? "'"+text : text).replace(/"/g,'""')+'"'; };
  const csv=[keys,...list.map((row: LegacyValue)=>keys.map((key: LegacyValue)=>row[key]))].map((row: LegacyValue)=>row.map(quote).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download="students.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 const stats=[["Total Students",rows.length,"users","blue"],["Active Students",rows.filter((row: LegacyValue)=>row.status==="Active").length,"check","green"],["Inactive Students",rows.filter((row: LegacyValue)=>row.status==="Inactive").length,"users","pink"],["New Enrollments",rows.filter((row: LegacyValue)=>row.joinedDate?.slice(0,7)===new Date().toISOString().slice(0,7)).length,"cap","purple"]];
 return <section className="admin-student-directory">
  <header className="asd-heading"><span className="asd-heading-icon"><PublicIcon name="users"/></span><div><h1>Students</h1><p>Manage and view student information, enrollments, and progress.</p></div><button className="asd-primary" onClick={()=>open({id:"",name:"",email:"",username:"",batch:""},"add")}><span aria-hidden="true">+</span> Add Student</button></header>
  <div className="asd-stats">{stats.map(([label,value,icon,color]: LegacyValue)=><article key={label}><span className={`asd-stat-icon asd-${color}`}><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p><small>{label==="New Enrollments"?"Joined this month":"Current student records"}</small></div></article>)}</div>
  <section className="asd-panel">
   <div className="asd-tools"><label className="asd-search"><PublicIcon name="search"/><input type="search" aria-label="Search students" placeholder="Search students..." value={search} onChange={(event: LegacyValue)=>{setSearch(event.target.value);setPage(1);}}/></label>{[["batch","Batches"],["status","Statuses"]].map(([key,label]: LegacyValue)=><select key={key} aria-label={`Filter ${label}`} value={filters[key]||""} onChange={(event: LegacyValue)=>changeFilter(key,event.target.value)}><option value="">All {label}</option>{[...new Set(rows.map((row: LegacyValue)=>row[key]).filter(Boolean))].map((value: LegacyValue)=><option key={value}>{value}</option>)}</select>)}<button onClick={()=>{setFilters({});setSearch("");setPage(1);}}>Reset filters</button><button className="asd-export" onClick={exportRows}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></svg>Export</button></div>
   {message&&<p className="asd-message" role="status">{message}</p>}
   <div className="asd-table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select displayed students" checked={displayed.length>0&&displayed.every((row: LegacyValue)=>selected.includes(row.id))} onChange={(event: LegacyValue)=>setSelected(event.target.checked?[...new Set([...selected,...displayed.map((row: LegacyValue)=>row.id)])]:selected.filter((id: LegacyValue)=>!displayed.some((row: LegacyValue)=>row.id===id)))}/></th>{["#","Photo","Name","Roll Number","Batch","Status","Join Date","Action"].map((label: LegacyValue)=><th key={label}>{label}</th>)}</tr></thead><tbody>{displayed.map((row: LegacyValue,index: LegacyValue)=><tr key={row.id}><td><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.includes(row.id)} onChange={(event: LegacyValue)=>setSelected(event.target.checked?[...selected,row.id]:selected.filter((id: LegacyValue)=>id!==row.id))}/></td><td>{start+index+1}</td><td><span className="asd-avatar">{row.image?<img src={row.image} alt=""/>:row.name.split(" ").map((part: LegacyValue)=>part[0]).slice(0,2).join("")}</span></td><td><strong>{row.name}</strong><small>{row.email}</small></td><td>{row.rollNumber||row.id}</td><td>{row.batch||"Unassigned"}</td><td><span className="asd-status" data-status={row.status}>{row.status}</span></td><td>{row.joinedDate||"Not recorded"}</td><td><div className="asd-actions"><button aria-label={`View ${row.name}`} onClick={()=>open(row,"view")}><Eye/></button><button aria-label={`Edit ${row.name}`} onClick={()=>open(row,"edit")}><PublicIcon name="design"/></button></div></td></tr>)}{!displayed.length&&<tr><td colSpan={9} className="asd-empty">No matching students.</td></tr>}</tbody></table></div>
   <footer className="asd-pagination"><span>Showing {visible.length?start+1:0} to {Math.min(start+size,visible.length)} of {visible.length} students</span><select aria-label="Students per page" value={size} onChange={(event: LegacyValue)=>{setSize(Number(event.target.value));setPage(1);}}>{[10,20,50].map((value: LegacyValue)=><option key={value} value={value}>{value} per page</option>)}</select><nav aria-label="Student pages"><button disabled={current===1} aria-label="Previous page" onClick={()=>setPage(current-1)}>&lsaquo;</button>{Array.from({length:pages},(_: LegacyValue,index: LegacyValue)=>index+1).filter((value: LegacyValue)=>value===1||value===pages||Math.abs(value-current)<=1).map((value: LegacyValue)=><button key={value} aria-current={value===current?"page":undefined} onClick={()=>setPage(value)}>{value}</button>)}<button disabled={current===pages} aria-label="Next page" onClick={()=>setPage(current+1)}>&rsaquo;</button></nav></footer>
  </section>
  <dialog ref={dialog} className="asd-dialog" aria-labelledby="asd-dialog-title" onCancel={(event: LegacyValue)=>{if(uploading)event.preventDefault();}}><h2 id="asd-dialog-title">{mode==="view"?"Student Details":mode==="add"?"Add Student":"Edit Student"}</h2>{record&&(mode==="view"?<><dl>{[["id","Roll Number"],...fields,["course","Course"],["batch","Batch"],["progress","Progress (%)"],["status","Status"]].map(([key,label]: LegacyValue)=><div key={key}><dt>{label}</dt><dd>{record[key] ?? "Not provided"}</dd></div>)}</dl><button onClick={()=>dialog.current.close()}>Close</button></>:<form onSubmit={save}><fieldset disabled={uploading}>{(mode==="add"?[["id","Student ID"],...fields,["batch","Batch"]]:fields).map(([key,label]: LegacyValue)=><label key={key}>{label}<input type={key==="email"?"email":"text"} required={["id","name","email"].includes(key)} value={record[key]||""} onChange={(event: LegacyValue)=>setRecord({...record,[key]:event.target.value})}/></label>)}<label>Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event: LegacyValue)=>{const file=event.target.files?.[0];if(!file)return;setUploading(true);try{const image=await readProfileImage(file);setRecord((value: LegacyValue)=>({...value,image}));}catch(error: LegacyValue){setError(error.message);}finally{setUploading(false);}}}/></label></fieldset>{error&&<p role="alert">{error}</p>}<footer><button type="button" disabled={uploading} onClick={()=>dialog.current.close()}>Cancel</button><button className="asd-primary" disabled={uploading}>{uploading?"Uploading...":"Save Student"}</button></footer></form>)}</dialog>
 </section>;
}
