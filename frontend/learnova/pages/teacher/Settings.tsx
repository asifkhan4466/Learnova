import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import PublicIcon from "../../components/PublicIcon";
import useProfile from "../../utils/useProfile";
import { teacherId } from "../../utils/batchStorage";
import { teachers } from "../../data/operations";

const key = "learnova_teacher_preferences";
export default function Settings() {
 const profile=useProfile(teacherId);
 const [values,setValues]=useState(()=>{try{return JSON.parse((localStorage.getItem(key) as LegacyValue)) || {};}catch{return {};}});
 const [message,setMessage]=useState("");
 const [tab,setTab]=useState("general");
 function save(event: LegacyValue){event.preventDefault();try{localStorage.setItem(key,JSON.stringify(values));setMessage("Preferences saved in this browser.");}catch{setMessage("Preferences could not be saved.");}}
 return <section className="tset-page"><header><h1>Settings</h1><p>Manage your personal preferences and account information.</p></header><nav aria-label="Settings categories">{[["general","General","design"],["notifications","Notifications","bell"],["account","Account","users"]].map(([value,label,icon]: LegacyValue)=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}><PublicIcon name={icon}/>{label}</button>)}</nav><div className="tset-grid">{tab!=="account" && <form className="tset-card" onSubmit={save}><header><span className="tset-icon"><PublicIcon name="bell"/></span><div><h2>Notification Preferences</h2><p>Choose your saved notification preferences.</p></div></header>{[["notifications","In-app Notifications","Updates about your classes and students."],["emailUpdates","Email Updates","Save your preference for email updates."]].map(([id,label,note]: LegacyValue)=><label className="tset-row" key={id}><span><strong>{label}</strong><small>{note}</small></span><input type="checkbox" role="switch" checked={values[id]!==false} onChange={(e: LegacyValue)=>{setValues({...values,[id]:e.target.checked});setMessage("");}}/></label>)}<p className="tset-note">Preferences are stored locally. Email and device push delivery are not connected.</p><button className="tset-primary" type="submit">Save Settings</button>{message&&<p role="status">{message}</p>}</form>}{tab!=="notifications" && <section className="tset-card"><header><span className="tset-icon"><PublicIcon name="users"/></span><div><h2>Account Settings</h2><p>Manage your teacher profile.</p></div></header><div className="tset-row"><div><strong>Email Address</strong><small>{profile.email || teachers.find((item: LegacyValue)=>item.id===teacherId)?.email}</small></div><Link to="/teacher/profile">Edit Profile</Link></div><div className="tset-row"><div><strong>Password</strong><small>Open the existing password recovery form.</small></div><Link to="/forgot-password?role=teacher">Reset Password</Link></div><div className="tset-row"><div><strong>Role</strong><small>Teacher ? Assigned courses and batches</small></div></div><div className="tset-row"><div><strong>Account Actions</strong><small>Return to the sign-in screen.</small></div><Link to="/teacher/logout">Logout</Link></div></section>}</div></section>;
}
