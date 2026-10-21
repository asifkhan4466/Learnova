import type { LegacyValue } from "../../../lib/legacy-types";
import { useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { usePeople, getTeachers, saveTeachers } from "../../utils/peopleStorage";
import { updateTeacher, deleteTeacher } from "../../utils/teacherManagement";
import { readProfileImage } from "../../utils/profileStorage";
import useCourses from "../../utils/useCourses";
import useBatches from "../../utils/useBatches";
import PublicIcon from "../../components/PublicIcon";


function ActionIcon({name}: LegacyValue) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name==="view"?<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>:<><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>}</svg>; }
function Avatar({teacher}: LegacyValue) {return <span className="atd-avatar">{teacher.image?<img src={teacher.image} alt=""/>:teacher.name.split(" ").map((part: LegacyValue)=>part[0]).slice(0,2).join("")}</span>;}
export default function Teachers() {
 const teachers=usePeople("teachers"), courses=useCourses(), state=useBatches();
 const [search,setSearch]=useState(""), [specialization,setSpecialization]=useState(""), [course,setCourse]=useState(""), [status,setStatus]=useState(""), [page,setPage]=useState(1);
 const [draft,setDraft]=useState<LegacyValue>(null),[originalId,setOriginalId]=useState(""),[selected,setSelected]=useState<LegacyValue>(null),[message,setMessage]=useState(""),[editError,setEditError]=useState(""),[uploading,setUploading]=useState(false);
 const editDialog=useRef<LegacyValue>(null), detailDialog=useRef<LegacyValue>(null);
 const assigned=(teacher: LegacyValue)=>courses.filter((item: LegacyValue)=>item.instructorId===teacher.id||(!item.instructorId&&item.instructor===teacher.name));
 const rating=(teacher: LegacyValue)=>{const list=assigned(teacher).filter((item: LegacyValue)=>item.rating>0);return list.length?list.reduce((sum: LegacyValue,item: LegacyValue)=>sum+Number(item.rating),0)/list.length:0;};
 const visible=teachers.filter((teacher: LegacyValue)=>`${teacher.name} ${teacher.email} ${teacher.id}`.toLowerCase().includes(search.toLowerCase())&&(!specialization||teacher.specialization===specialization)&&(!status||teacher.status===status)&&(!course||assigned(teacher).some((item: LegacyValue)=>String(item.id)===course)));
 const pages=Math.max(1,Math.ceil(visible.length/8)), current=Math.min(page,pages), start=(current-1)*8, displayed=visible.slice(start,start+8);
 function edit(teacher: LegacyValue) {setOriginalId(teacher?.id||"");setDraft(teacher?{...teacher}:{id:"",name:"",email:"",status:"Active",username:""});setEditError("");editDialog.current.showModal();}
 function save(event: LegacyValue) {event.preventDefault();try{
  if(originalId) updateTeacher(originalId,draft);
  else {
   const person={...draft,id:draft.id.trim(),name:draft.name.trim(),email:draft.email.trim(),courses:0,students:0};
   if(!/^[a-zA-Z0-9_-]{3,40}$/.test(person.id)||!person.name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))throw new Error("Enter a valid ID, name and email.");
   if(person.username&&!/^[a-zA-Z0-9._-]{3,30}$/.test(person.username))throw new Error("Username must be 3 to 30 letters, numbers, dots, hyphens or underscores.");
   const rows=getTeachers();if(rows.some((row: LegacyValue)=>row.id.toLowerCase()===person.id.toLowerCase()||row.email?.toLowerCase()===person.email.toLowerCase()||(person.username&&row.username?.toLowerCase()===person.username.toLowerCase())))throw new Error("A teacher already uses this ID, email or username.");
   saveTeachers([...rows,person]);
  }
  editDialog.current.close();setMessage(originalId?"Teacher updated.":"Teacher added.");
 }catch(error: LegacyValue){setEditError(error.message);}}
 function remove(teacher: LegacyValue){if(!window.confirm(`Delete ${teacher.name}? Courses and batches will be kept but unassigned.`))return;try{deleteTeacher(teacher.id);setMessage("Teacher deleted.");}catch(error: LegacyValue){setMessage(error.message);}}
 async function upload(event: LegacyValue){const file=event.target.files?.[0];if(!file)return;setUploading(true);try{const image=await readProfileImage(file);setDraft((value: LegacyValue)=>({...value,image}));}catch(error: LegacyValue){setEditError(error.message);}finally{setUploading(false);}}
 function view(teacher: LegacyValue){setSelected(teacher);detailDialog.current.showModal();}
 const stats=[["Total Teachers",teachers.length,"users","blue"],["Active Teachers",teachers.filter((t: LegacyValue)=>t.status==="Active").length,"check","green"],["Inactive Teachers",teachers.filter((t: LegacyValue)=>t.status==="Inactive").length,"users","pink"],["Assigned Courses",teachers.reduce((sum: LegacyValue,t: LegacyValue)=>sum+assigned(t).length,0),"cap","orange"]];
 const top=[...teachers].filter((t: LegacyValue)=>rating(t)>0).sort((a: LegacyValue,b: LegacyValue)=>rating(b)-rating(a)).slice(0,3);
 const activity=state.classes.filter((item: LegacyValue)=>teachers.some((t: LegacyValue)=>t.id===item.teacherId)).slice(-3).reverse();
 return <section className="admin-teacher-directory">
  <header className="atd-heading"><div><h1>Teachers</h1><p>Manage all teachers. Add, edit, and view their courses and performance.</p></div><div className="atd-heading-right"><nav aria-label="Breadcrumb"><Link to="/admin/dashboard">Dashboard</Link><span aria-hidden="true">?</span><span>Teachers</span></nav><button className="atd-primary" onClick={()=>edit(null)}><span aria-hidden="true">+</span> Add Teacher</button></div></header>
  <div className="atd-stats">{stats.map(([label,value,icon,tone]: LegacyValue)=><article key={label}><span className={`atd-stat-icon atd-${tone}`}><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p><small>{label==="Assigned Courses"?"Current course assignments":"Current teacher records"}</small></div></article>)}</div>
  <section className="atd-filters"><label>Search Teacher<span className="atd-search"><PublicIcon name="search"/><input type="search" placeholder="Search by name, email, ID..." value={search} onChange={(e: LegacyValue)=>{setSearch(e.target.value);setPage(1);}}/></span></label><label>Specialization<select value={specialization} onChange={(e: LegacyValue)=>{setSpecialization(e.target.value);setPage(1);}}><option value="">All Specializations</option>{[...new Set(teachers.map((t: LegacyValue)=>t.specialization).filter(Boolean))].map((value: LegacyValue)=><option key={value}>{value}</option>)}</select></label><label>Courses<select value={course} onChange={(e: LegacyValue)=>{setCourse(e.target.value);setPage(1);}}><option value="">All Courses</option>{courses.map((item: LegacyValue)=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Status<select value={status} onChange={(e: LegacyValue)=>{setStatus(e.target.value);setPage(1);}}><option value="">All Statuses</option><option>Active</option><option>Inactive</option></select></label><button onClick={()=>{setSearch("");setSpecialization("");setCourse("");setStatus("");setPage(1);}}>? &nbsp; Reset</button></section>
  {message&&<p role="status" className="atd-message">{message}</p>}
  <section className="atd-panel"><div className="atd-table-wrap"><table><thead><tr>{["#","Teacher","Teacher ID","Specialization","Email","Courses","Status","Join Date","Actions"].map((label: LegacyValue)=><th key={label}>{label}</th>)}</tr></thead><tbody>{displayed.map((teacher: LegacyValue,index: LegacyValue)=><tr key={teacher.id}><td>{start+index+1}</td><td><div className="atd-person"><Avatar teacher={teacher}/><span>{teacher.name}</span></div></td><td>{teacher.id}</td><td>{teacher.specialization||"Not provided"}</td><td>{teacher.email}</td><td>{assigned(teacher).length}</td><td><span className="atd-status" data-status={teacher.status}>{teacher.status}</span></td><td>{teacher.joinedDate||"Not recorded"}</td><td><div className="atd-actions"><button aria-label={`View ${teacher.name}`} onClick={()=>view(teacher)}><ActionIcon name="view"/></button><button aria-label={`Edit ${teacher.name}`} onClick={()=>edit(teacher)}><PublicIcon name="design"/></button><button className="atd-delete" aria-label={`Delete ${teacher.name}`} onClick={()=>remove(teacher)}><ActionIcon name="delete"/></button></div></td></tr>)}{!displayed.length&&<tr><td colSpan={9} className="atd-empty">No matching teachers.</td></tr>}</tbody></table></div><footer className="atd-pagination"><span>Showing {visible.length?start+1:0} to {Math.min(start+8,visible.length)} of {visible.length} teachers</span><nav aria-label="Teacher pages"><button disabled={current===1} aria-label="Previous page" onClick={()=>setPage(current-1)}>&lsaquo;</button>{Array.from({length:pages},(_: LegacyValue,i: LegacyValue)=>i+1).filter((n: LegacyValue)=>n===1||n===pages||Math.abs(n-current)<=1).map((n: LegacyValue)=><button key={n} aria-current={n===current?"page":undefined} onClick={()=>setPage(n)}>{n}</button>)}<button disabled={current===pages} aria-label="Next page" onClick={()=>setPage(current+1)}>&rsaquo;</button></nav></footer></section>
  <div className="atd-bottom"><section className="atd-panel"><header><h2><PublicIcon name="chart"/>Top Performing Teachers</h2></header><div className="atd-top-teachers">{top.map((teacher: LegacyValue)=><button key={teacher.id} onClick={()=>view(teacher)}><Avatar teacher={teacher}/><span><strong>{teacher.name}</strong><b>{rating(teacher).toFixed(1)} ?</b><small>{teacher.students||0} Students</small></span></button>)}{!top.length&&<p>No teacher ratings recorded yet.</p>}</div></section><section className="atd-panel"><header><h2><PublicIcon name="clock"/>Teacher Activity</h2><Link to="/admin/live-classes">View classes</Link></header><div className="atd-activity">{activity.map((item: LegacyValue)=><div key={item.id}><span><PublicIcon name="video"/></span><p>{teachers.find((t: LegacyValue)=>t.id===item.teacherId)?.name}<small>{item.lectureTitle||item.course||"Class session"}</small></p><small>{item.status}</small></div>)}{!activity.length&&<p>No class activity recorded yet.</p>}</div></section></div>
    <dialog ref={editDialog} className="atd-dialog" aria-labelledby="teacher-edit-title" onClose={()=>setDraft(null)} onCancel={(event: LegacyValue)=>{if(uploading) event.preventDefault();}}>
      <h2 id="teacher-edit-title">{originalId ? "Edit Teacher" : "Add Teacher"}</h2>
      {draft && <form onSubmit={save}>
        <fieldset disabled={uploading} className="at-edit-fields">
          {[ ["id","Teacher ID"], ["name","Full Name"], ["email","Email Address"], ["username","Username"], ["phone","Phone Number"], ["specialization","Specialization"], ["experience","Experience"], ["joinedDate","Joined Date"] ].map(([key,label]: LegacyValue) => <label key={key}>{label}<input name={key} type={key === "email" ? "email" : key === "joinedDate" ? "date" : "text"} value={draft[key] || ""} required={["id","name","email"].includes(key)} onChange={(event: LegacyValue)=>setDraft({...draft,[key]:event.target.value})} /></label>)}
          <label>Status<select value={draft.status} onChange={(event: LegacyValue)=>setDraft({...draft,status:event.target.value})}><option>Active</option><option>Inactive</option></select></label>
          <label>Bio<textarea rows={3} value={draft.bio || ""} onChange={(event: LegacyValue)=>setDraft({...draft,bio:event.target.value})} /></label>
          <label>Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label>
          {draft.image && <div><img className="at-photo-preview" src={draft.image} alt="Teacher profile preview" /><button type="button" onClick={()=>setDraft({...draft,image:""})}>Remove Photo</button></div>}
        </fieldset>
        <p className="at-edit-note">Course assignments, live classes and ratings come from their linked records. Changing the teacher ID or name keeps those links.</p>
        {editError && <p role="alert" className="at-edit-error">{editError}</p>}
        <footer className="at-edit-footer"><button type="button" disabled={uploading} onClick={()=>editDialog.current.close()}>Cancel</button><button className="at-save" type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Save Changes"}</button></footer>
      </form>}
    </dialog>

  <dialog ref={detailDialog} className="atd-dialog" aria-labelledby="atd-detail-title"><h2 id="atd-detail-title">Teacher Details</h2>{selected&&<dl>{[["Name",selected.name],["ID",selected.id],["Email",selected.email],["Specialization",selected.specialization],["Phone",selected.phone],["Experience",selected.experience],["Bio",selected.bio],["Status",selected.status],["Join Date",selected.joinedDate],["Assigned Courses",assigned(selected).map((item: LegacyValue)=>item.title).join(", ")]].map(([label,value]: LegacyValue)=><div key={label}><dt>{label}</dt><dd>{value||"Not provided"}</dd></div>)}</dl>}<button onClick={()=>detailDialog.current.close()}>Close</button></dialog>
 </section>;
}
