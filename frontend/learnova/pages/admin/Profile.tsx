import type { LegacyValue } from "../../../lib/legacy-types";
import { currentSubAdminId, subAdmins } from "../../utils/adminPermissions";
import { AdminHeading } from "../../components/AdminSummary";
import AdminPermissionList from "../../components/AdminPermissionList";

import { readProfile, saveProfile } from "../../utils/profileStorage";
import { useState } from "react";

const defaultAccount = { name: "Admin", email: "subadmin@learnova.com", id: "SA-1001", role: "Admin", initials: "SA" };

function Profile({ account = { ...defaultAccount, ...subAdmins.find((person: LegacyValue) => person.id === currentSubAdminId) } }: LegacyValue) {
  const [profile, setProfile] = useState(() => readProfile(account.id, { name: account.name, email: account.email, phone: "+92 300 0000000", image: "" }));
  const [draft, setDraft] = useState<LegacyValue>(null);
  const [message, setMessage] = useState("");
  const current = draft || profile;
  function change(event: LegacyValue) { setDraft({ ...draft, [event.target.name]: event.target.value }); }
  function upload(event: LegacyValue) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) { setMessage("Choose a PNG or JPEG image up to 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setDraft((value: LegacyValue) => value ? { ...value, image: reader.result } : value); setMessage(""); };
    reader.onerror = () => setMessage("The image could not be read.");
    reader.readAsDataURL(file);
  }
  function save(event: LegacyValue) {
    event.preventDefault();
    if (!draft.name.trim()) { setMessage("Enter your full name."); return; }
    try { setProfile(saveProfile(account.id, draft)); setDraft(null); setMessage("Profile updated."); } catch (error: LegacyValue) { setMessage(error.message); }
  }
  return <div className="subadmin-profile-page">
    {account.role === "Admin" ? <AdminHeading title="My Profile" subtitle="View and update your account information." icon="users">{!draft&&<button type="button" onClick={()=>{setDraft({...profile});setMessage("");}}>Edit Profile</button>}</AdminHeading> : (<header className="subadmin-profile-header"><div><h1>My Profile</h1><p>View and update your account information.</p></div>{!draft && <button type="button" onClick={() => { setDraft({ ...profile }); setMessage(""); }}>Edit Profile</button>}</header>)}
    <form className="subadmin-profile-card" onSubmit={save}>
      <div className="subadmin-profile-identity"><div className="subadmin-profile-avatar">{current.image ? <img src={current.image} alt={current.name} onError={() => { setDraft((value: LegacyValue) => value ? { ...value, image: "" } : value); setMessage("Choose a valid image."); }} /> : <span>{current.name.trim().split(/\s+/).map((part: LegacyValue) => part[0]).slice(0, 2).join("") || account.initials}</span>}</div><div><h2>{current.name}</h2><p>{account.role}</p>{draft && <label className="subadmin-profile-upload">Profile Image<input type="file" accept="image/png,image/jpeg" onChange={upload} /></label>}</div>{account.role === "Admin" && <div className="sa-profile-contact"><span className="sa-status" data-status="Active">Active</span><p>{current.email}</p><p>{current.phone || "Phone not provided"}</p></div>}</div>
      <div className="subadmin-profile-fields"><section className="sa-profile-personal">{account.role === "Admin" && <h2>Personal Information</h2>}
        <div><label htmlFor="subadmin-profile-name">Full Name</label>{draft ? <input id="subadmin-profile-name" name="name" value={draft.name} onChange={change} required maxLength={100} autoComplete="name" /> : <p>{profile.name}</p>}</div>
        <div><label htmlFor="subadmin-profile-phone">Phone Number</label>{draft ? <input id="subadmin-profile-phone" name="phone" type="tel" value={draft.phone} onChange={change} maxLength={30} autoComplete="tel" /> : <p>{profile.phone || "Not provided"}</p>}</div>
        <div><label htmlFor="profile-contact-email">Email</label>{draft ? <input id="profile-contact-email" name="email" type="email" value={draft.email} onChange={change} required/> : <p>{profile.email}</p>}</div>
        </section><section className="sa-profile-account">{account.role === "Admin" && <h2>Account Information</h2>}{[ ["User ID", account.id], ["Role", account.role], ["Account Status", "Active"]].map(([label, value]: LegacyValue) => <div key={label}><span className="subadmin-profile-label">{label}</span><p>{value}</p></div>)}
      </section></div>
      {draft && <div className="subadmin-profile-actions"><button type="button" onClick={() => { setDraft(null); setMessage(""); }}>Cancel</button><button type="submit">Save Changes</button></div>}
      {message && <p className="subadmin-profile-message" role="status">{message}</p>}
    </form>
    {account.role === "Admin" && <div className="sa-two-col sa-profile-bottom"><section className="sa-panel sa-profile-permissions"><h2>Permission Overview</h2><p>Your current module access, assigned by Super Admin.</p><AdminPermissionList/></section><section className="sa-panel"><h2>Recent Activity</h2><p>No timestamped account activity is recorded in this frontend.</p><p>Your saved profile information appears in your portal header. Module permissions remain managed by Super Admin.</p></section></div>}
  </div>;
}
export default Profile;
