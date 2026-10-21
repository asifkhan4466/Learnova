import type { LegacyValue } from "../../lib/legacy-types";
import { useState } from "react";
import { usePeople, getTeachers, saveTeachers } from "../utils/peopleStorage";
import { saveProfile, readProfileImage } from "../utils/profileStorage";
import useBatches from "../utils/useBatches";
import useCourses from "../utils/useCourses";

export default function PeopleManager({kind = "teachers"}: LegacyValue) {
 const rows = usePeople(kind), state = useBatches(), courses = useCourses();
 const [form,setForm]=useState<LegacyValue>(null), [editing,setEditing]=useState(false), [message,setMessage]=useState("");
 function submit(e: LegacyValue) { e.preventDefault(); try {
 if (!editing && getTeachers().some((t: LegacyValue)=>t.id===form.id)) throw new Error("Teacher ID already exists.");
 if (kind === "teachers" && getTeachers().some((t: LegacyValue)=>t.id!==form.id && t.username?.toLowerCase()===form.username.toLowerCase())) throw new Error("Username already exists.");
 saveProfile(form.id,form);
 if(kind === "teachers") saveTeachers(editing ? getTeachers().map((t: LegacyValue)=>t.id===form.id ? {...t,...form}:t) : [...getTeachers(),{...form,status:"Active",courses:0,students:0}]);
 setForm(null); setMessage("Profile saved.");
 } catch(error: LegacyValue) {setMessage(error.message);} }
 function remove() {try { if(state.batches.some((b: LegacyValue)=>b.teacherId===form.id) || courses.some((c: LegacyValue)=>c.instructorId===form.id || c.instructor===form.name)) throw new Error("This teacher has assigned courses or batches. Reassign them before removal."); if(!window.confirm(`Remove ${form.name}?`)) return; saveTeachers(getTeachers().filter((t: LegacyValue)=>t.id!==form.id));setForm(null);setMessage("Teacher removed.");}catch(error: LegacyValue){setMessage(error.message);}}
 return <section className="management-card"><h2>{kind === "teachers" ? "Teacher Management" : "Edit Student Profile"}</h2>
 <select aria-label="Select profile to edit" value={form?.id || ""} onChange={(e: LegacyValue)=>{const row=rows.find((t: LegacyValue)=>t.id===e.target.value);setEditing(true);setForm(row ? {...row,username:row.username || row.email?.split("@")[0] || row.id}:null);setMessage("");}}><option value="">Select a profile to edit</option>{rows.map((t: LegacyValue)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
 {kind === "teachers" && <button onClick={()=>{setEditing(false);setForm({id:"",name:"",username:"",email:"",image:""});setMessage("");}}>Add New Teacher</button>}
 {form && <form onSubmit={submit}><div className="management-grid">{["id","name","username","email","phone",...(kind === "teachers" ? ["specialization","experience"]:["program"]),"bio"].map((key: LegacyValue)=><label key={key}>{key === "id" ? "ID" : key}<input required={["id","name","username"].includes(key)} readOnly={key==="id" && editing} type={key==="email" ? "email":"text"} value={form[key] || ""} onChange={(e: LegacyValue)=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e: LegacyValue)=>{const file=e.target.files[0];if(file) try {const image=await readProfileImage(file);setForm((f: LegacyValue)=>({...f,image}));}catch(error: LegacyValue){setMessage(error.message);}}}/></label></div>{form.image && <img width="70" height="70" src={form.image} alt="Profile preview"/>}<button type="submit">Save Profile</button><button type="button" onClick={()=>setForm(null)}>Cancel</button>{kind === "teachers" && editing && <button type="button" onClick={remove}>Remove Teacher</button>}</form>}{message && <p role="status">{message}</p>}</section>;
}
