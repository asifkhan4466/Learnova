import type { LegacyValue } from "../../../lib/legacy-types";
import useAdminTheme, { setSubAdminTheme, themeColors } from "../../utils/useAdminTheme";
import { Link } from "@/lib/navigation";
import { readProfile, saveProfile } from "../../utils/profileStorage";
import { currentSubAdminId, subAdmins } from "../../utils/adminPermissions";
import { useState } from "react";
import { AdminHeading } from "../../components/AdminSummary";
import PublicIcon from "../../components/PublicIcon";

const key="learnova_subadmin_preferences";
const options=[["enrollments","Enrollment Updates"],["payments","Payment Updates"],["classes","Live Class Updates"],["assignments","Assignment Updates"]];
export default function Settings(){
 const theme=useAdminTheme();
 const [themeMessage,setThemeMessage]=useState("");
 const [profile,setProfile]=useState(()=>readProfile(currentSubAdminId,{name:subAdmins.find((person: LegacyValue)=>person.id===currentSubAdminId)?.name||"Admin",email:subAdmins.find((person: LegacyValue)=>person.id===currentSubAdminId)?.email||"",phone:""}));
 const [profileMessage,setProfileMessage]=useState("");
 function saveAccount(event: LegacyValue){event.preventDefault();try{setProfile(saveProfile(currentSubAdminId,profile));setProfileMessage("Account information saved.");}catch(error: LegacyValue){setProfileMessage(error.message);}}
 const [values,setValues]=useState(()=>{try{return JSON.parse((localStorage.getItem(key) as LegacyValue))||{};}catch{return {};}}),[message,setMessage]=useState("");
 function save(e: LegacyValue){e.preventDefault();try{localStorage.setItem(key,JSON.stringify(values));setMessage("Preferences saved in this browser.");}catch{setMessage("Preferences could not be saved.");}}
 return <section className="sa-page"><AdminHeading title="Settings" subtitle="View platform information and manage your personal preferences." icon="design"/><div className="sa-settings-layout"><nav className="sa-panel sa-settings-nav" aria-label="Settings sections"><a href="#sa-general"><PublicIcon name="design"/>General</a><a href="#sa-branding"><PublicIcon name="cap"/>Branding</a><a href="#sa-account"><PublicIcon name="book"/>Account &amp; Email</a><a href="#sa-preferences"><PublicIcon name="clock"/>Notifications</a><Link to="/admin/permissions"><PublicIcon name="target"/>Access &amp; Permissions</Link><Link to="/admin/profile"><PublicIcon name="users"/>My Profile</Link></nav><div>
 <section className="sa-panel" id="sa-general"><h2>General Settings</h2><p>Platform information is managed by Super Admin.</p><dl className="sa-form-grid"><div><dt>Platform Name</dt><dd>Learnova</dd></div><div><dt>Currency</dt><dd>PKR - Pakistani Rupee</dd></div><div><dt>Your Role</dt><dd>Administrator</dd></div><div><dt>Access Level</dt><dd>Assigned modules only</dd></div></dl></section>
 <form className="sa-panel" id="sa-account" onSubmit={saveAccount}><h2>Account Information</h2><p>Update your personal name, email and phone number.</p><div className="sa-form-grid">{[["name","Full Name","text"],["email","Email","email"],["phone","Phone Number","tel"]].map(([name,label,type]: LegacyValue)=><label key={name}>{label}<input name={name} type={type} required={name!=="phone"} value={profile[name]||""} onChange={(event: LegacyValue)=>{setProfile({...profile,[name]:event.target.value});setProfileMessage("");}}/></label>)}</div><button className="sa-primary" type="submit">Save Account</button>{profileMessage&&<p role="status">{profileMessage}</p>}</form>
 <section className="sa-panel" id="sa-branding"><h2>Appearance &amp; Theme</h2><p>Choose your panel accent color. Your selection is saved automatically.</p><div className="sa-branding-preview"><div className="sa-swatches">{["blue","purple","cyan","gold","navy"].map((color: LegacyValue)=><button type="button" key={color} title={color} aria-label={`Apply ${color} theme`} aria-pressed={theme===color} style={{background:(themeColors as LegacyValue)[color]}} onClick={()=>{try{setSubAdminTheme(color);setThemeMessage(`${color} theme applied.`);}catch{setThemeMessage("Theme could not be saved.");}}}/>)}</div><img src="/Logo.png" alt="Learnova logo"/></div>{themeMessage && <p role="status">{themeMessage}</p>}</section>
 <form className="sa-panel" onSubmit={save} id="sa-preferences"><h2>Notification Preferences</h2><p>Save your personal preferences for this browser.</p><div className="sa-preference-grid">{options.map(([id,label]: LegacyValue)=><label key={id}><PublicIcon name="clock"/><span>{label}</span><input type="checkbox" role="switch" checked={values[id]!==false} onChange={(e: LegacyValue)=>{setValues({...values,[id]:e.target.checked});setMessage("");}}/></label>)}</div><button className="sa-primary" type="submit">Save Changes</button>{message&&<p role="status">{message}</p>}</form></div></div></section>;
}
