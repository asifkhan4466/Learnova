import type { LegacyValue } from "../../../lib/legacy-types";
import useProfile from "../../utils/useProfile";

import { useId, useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { subAdmins, operationalPermissions, changeAdminPermission, createSubAdmin, updateSubAdmin, deleteSubAdmin } from "../../utils/adminPermissions";
import usePermissions from "../../utils/usePermissions";
import PublicIcon from "../../components/PublicIcon";

function PasswordField({ label, name, required = false, hint, value, readOnly = false }: LegacyValue) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <div className="asa-password-field">
    <label htmlFor={id}>{label}</label>
    <div className="asa-password-input">
      <input id={id} name={name} value={value} readOnly={readOnly} type={visible ? "text" : "password"} required={required} minLength={8} autoComplete="new-password" spellCheck={false} aria-describedby={hint ? `${id}-hint` : undefined} />
      <button type="button" className="asa-password-eye" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id} onClick={() => setVisible((value: LegacyValue) => !value)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
      </button>
    </div>
    {hint && <small id={`${id}-hint`}>{hint}</small>}
  </div>;
}

function SuperAdminProfileDetails({ person, permissions }: LegacyValue) {
  const profile = useProfile(person.id);
  const modules = operationalPermissions.filter(([key]: LegacyValue) => permissions?.[key]).map(([, label]: LegacyValue) => label);
  return <section className="asa-profile-details">
    {profile.image && <img className="asa-profile-photo" src={profile.image} alt={`${person.name} profile`} />}
    <dl>{[["Name",person.name],["User ID",person.id],["Email",person.email],["Role","Admin"],["Status",person.status],["Phone",profile.phone || "Not provided"],["Bio",profile.bio || "Not provided"],["Last Login",person.lastLogin || "Not recorded"],["Assigned Modules",modules.join(", ") || "None assigned"],["Public Website Access",permissions?.publicWebsite ? "Enabled" : "Disabled"]].map(([label,value]: LegacyValue) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="asa-account-fields">
      {person.demoPassword ? <PasswordField label="Current Password" name="currentPassword" value={person.demoPassword} readOnly hint="Frontend demo password. Use test passwords only." /> : <div><strong>Current Password</strong><p>{person.passwordHash ? "This older password cannot be displayed. Set a new password using Edit to make it available here." : "No password has been assigned. Set one using Edit."}</p></div>}
    </div>
  </section>;
}

export default function Admins() {
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [module, setModule] = useState("");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<LegacyValue>(null);
  const [tab, setTab] = useState("Permissions");
  const [message, setMessage] = useState("");
  const dialog = useRef<LegacyValue>(null);
  const createDialog = useRef<LegacyValue>(null);
  const accountDialog = useRef<LegacyValue>(null);
  const [account, setAccount] = useState<LegacyValue>(null);
  const [accountError, setAccountError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  function editAccount(person: LegacyValue) {
    setAccount({ ...person }); setAccountError("");
    accountDialog.current.showModal();
  }
  async function saveAccount(event: LegacyValue) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setAccountError("Passwords do not match."); return; }
    setSavingAccount(true); setAccountError("");
    try {
      await updateSubAdmin(account.id, { id: data.get("id") as string, name: data.get("name"), email: data.get("email"), status: data.get("status"), password: data.get("password") as string });
      accountDialog.current.close();
      setMessage("Admin updated successfully.");
    } catch (error: LegacyValue) { setAccountError(error.message); }
    finally { setSavingAccount(false); }
  }
  function removeAccount(person: LegacyValue) {
    if (!window.confirm(`Delete ${person.name} (${person.id})? They will lose access. This cannot be undone.`)) return;
    try { deleteSubAdmin(person.id); setMessage(`Admin ${person.name} deleted.`); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createFormKey, setCreateFormKey] = useState(0);
  async function addAccount(event: LegacyValue) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setCreateError("Passwords do not match."); return; }
    setCreating(true); setCreateError("");
    try {
      const person = await createSubAdmin({ name: data.get("name"), email: data.get("email"), id: data.get("id") as string, password: data.get("password"), modules: Object.fromEntries(operationalPermissions.map(([key]: LegacyValue) => [key, data.has(key)])) });
      setSearch(""); setStatus(""); setModule(""); createDialog.current.close();
      setMessage(`Admin ${person.name} created. Login ID: ${person.id}. Share the assigned password with them.`);
    } catch (error: LegacyValue) { setCreateError(error.message); }
    finally { setCreating(false); }
  }
  const rows = subAdmins.filter((person: LegacyValue) => `${person.name} ${person.email} ${person.id}`.toLowerCase().includes(search.toLowerCase()) && (!status || person.status === status) && (!module || permissions[person.id]?.[module]));
  rows.sort((a: LegacyValue, b: LegacyValue) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? subAdmins.indexOf(a) - subAdmins.indexOf(b) : subAdmins.indexOf(b) - subAdmins.indexOf(a));
  function open(person: LegacyValue) { const initial = { ...permissions[person.id] }; setEditing({ person, initial, draft: { ...initial } }); setTab("Permissions"); setMessage(""); dialog.current.showModal(); }
  function toggle(id: LegacyValue,key: LegacyValue,value: LegacyValue) { try { changeAdminPermission(id,key,value); setMessage("Permissions saved."); } catch(error: LegacyValue) { setMessage(error.message); } }
  function save() {
    try { for (const [key] of operationalPermissions) if (editing.draft[key] !== editing.initial[key]) changeAdminPermission(editing.person.id,key,editing.draft[key]); dialog.current.close(); setMessage("Permissions saved."); }
    catch(error: LegacyValue) { setMessage(error.message); }
  }
  const stats = [["Total Admins",subAdmins.length,"users",0],["Active",subAdmins.filter((person: LegacyValue)=>person.status === "Active").length,"check",1],["Inactive",subAdmins.filter((person: LegacyValue)=>person.status === "Inactive").length,"users",2],["Pending Invitations",subAdmins.filter((person: LegacyValue)=>person.status === "Pending").length,"briefcase",4]];
  return <div className={`admin-subadmins${editing ? " asa-editing" : ""}`}>
    <header className="as-banner"><div><h1>Admins</h1><p>Manage Administrators, assign permissions and control access across your platform.</p></div><div className="as-banner-art"><span>“Great teams build great learning<br />experiences.”<small>— Learnova</small></span><PublicIcon name="users" /></div></header>
    <div className="as-stats">{stats.map(([label,value,icon,tone]: LegacyValue)=><article key={label} className={`as-tone-${tone}`}><span className="as-stat-icon"><PublicIcon name={icon}/></span><div><strong>{value}</strong><span>{label}</span><small>{label === "Total Admins" ? "Account overview" : `${subAdmins.length ? Math.round(value / subAdmins.length * 100) : 0}% of total`}</small></div></article>)}</div>
    <section className="asa-panel"><div className="as-tools"><label className="as-search"><PublicIcon name="search"/><input aria-label="Search Admins" placeholder="Search by name, email or ID..." value={search} onChange={(event: LegacyValue)=>setSearch(event.target.value)}/></label><select aria-label="Access status" value={status} onChange={(event: LegacyValue)=>setStatus(event.target.value)}><option value="">All Access Status</option>{[...new Set(subAdmins.map((person: LegacyValue)=>person.status))].map((value: LegacyValue)=><option key={value}>{value}</option>)}</select><select aria-label="Module" value={module} onChange={(event: LegacyValue)=>setModule(event.target.value)}><option value="">All Modules</option>{operationalPermissions.map(([key,label]: LegacyValue)=><option key={key} value={key}>{label}</option>)}</select><select aria-label="Sort Admins" value={sort} onChange={(event: LegacyValue) => setSort(event.target.value)}><option value="newest">Sort by: Newest</option><option value="oldest">Sort by: Oldest</option><option value="name">Sort by: Name</option></select><button className="asa-save" onClick={() => { setCreateError(""); setCreateFormKey((value: LegacyValue) => value + 1); createDialog.current.showModal(); }}>+ Add Admin</button></div>
      {message && !editing && <p role="status">{message}</p>}
      <div className="as-table-wrap"><table><thead><tr>{["Admin","Admin ID","Assigned Modules","Public Website Access","Status","Last Login","Actions"].map((label: LegacyValue)=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((person: LegacyValue)=><tr key={person.id}><td><div className="as-student"><span className="as-avatar">{person.name.split(" ").map((part: LegacyValue)=>part[0]).slice(0,2).join("")}</span><div><strong>{person.name}</strong><small>{person.email}</small></div></div></td><td>{person.id}</td><td><div className="asa-tags">{operationalPermissions.filter(([key]: LegacyValue)=>permissions[person.id]?.[key]).slice(0,3).map(([key,label]: LegacyValue)=><span key={key}>{label.replace(/^(Manage|View|Verify) /,"")}</span>)}{operationalPermissions.filter(([key]: LegacyValue)=>permissions[person.id]?.[key]).length > 3 && <button className="asa-more-modules" aria-label={`View all modules for ${person.name}`} onClick={()=>open(person)}>+{operationalPermissions.filter(([key]: LegacyValue)=>permissions[person.id]?.[key]).length - 3}</button>}{!operationalPermissions.some(([key]: LegacyValue)=>permissions[person.id]?.[key])&&<small>None assigned</small>}</div></td><td><input className="asa-switch" type="checkbox" role="switch" aria-label={`Public website access for ${person.name}`} checked={permissions[person.id]?.publicWebsite===true} onChange={(event: LegacyValue)=>toggle(person.id,"publicWebsite",event.target.checked)}/></td><td><span className={`as-badge ${person.status==="Active"?"as-good":"as-inactive"}`}>● {person.status}</span></td><td>{person.lastLogin||"Not recorded"}</td><td><div className="asa-row-actions"><button aria-label={`Edit account for ${person.name}`} onClick={()=>editAccount(person)}>Edit</button><button className="asa-delete" aria-label={`Delete ${person.name}`} onClick={()=>removeAccount(person)}>Delete</button><button className="as-view" aria-label={`Edit permissions for ${person.name}`} onClick={()=>open(person)}>⋯</button></div></td></tr>)}{!rows.length&&<tr><td colSpan={"7" as unknown as number} className="as-empty">No matching Admins.</td></tr>}</tbody></table></div>
      <footer className="as-pagination"><span>Showing {rows.length} of {subAdmins.length} Admins</span><nav aria-label="Admin pages"><button disabled aria-label="Previous page">‹</button><button aria-current="page">1</button><button disabled aria-label="Next page">›</button></nav></footer>
    </section>
    <dialog ref={accountDialog} className="asa-drawer asa-create-dialog" aria-labelledby="asa-edit-account-title" onClose={()=>setAccount(null)} onCancel={(event: LegacyValue)=>{if(savingAccount) event.preventDefault();}}>
      {account && <form key={account.id} onSubmit={saveAccount}>
        <div className="asa-drawer-heading"><h2 id="asa-edit-account-title">Edit Admin</h2><button type="button" aria-label="Close edit account" disabled={savingAccount} onClick={()=>accountDialog.current.close()}>&times;</button></div>
        <fieldset className="asa-account-fields" disabled={savingAccount}>
          <label>Admin ID<input name="id" defaultValue={account.id} required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_\-]{3,40}" autoComplete="off" /><small>3 to 40 letters, numbers, hyphens or underscores. Use the updated ID to log in after saving.</small></label>
          <label>Full Name<input name="name" defaultValue={account.name} required maxLength={100} autoComplete="name" /></label>
          <label>Email Address<input name="email" type="email" defaultValue={account.email} required autoComplete="email" /></label>
          <label>Status<select name="status" defaultValue={account.status}><option>Active</option><option>Inactive</option><option>Pending</option></select></label>
          {account.demoPassword ? <PasswordField label="Current Password" name="currentPassword" value={account.demoPassword} readOnly hint="This is the latest saved password. Click the eye to view it." /> : <div className="asa-password-field"><span>Current Password</span><small>{account.passwordHash ? "The older password is unavailable. Save a new password below to view it here next time." : "No password has been assigned yet."}</small></div>}
          <PasswordField label="New Password" name="password" hint="Leave blank to keep the current password. Saving a new password replaces it." />
          <PasswordField label="Confirm New Password" name="confirmPassword" />
        </fieldset>
        {accountError && <p role="alert" className="asa-error">{accountError}</p>}
        <footer className="asa-drawer-footer"><button type="button" disabled={savingAccount} onClick={()=>accountDialog.current.close()}>Cancel</button><button type="submit" className="asa-save" disabled={savingAccount}>{savingAccount ? "Saving..." : "Save Changes"}</button></footer>
      </form>}
    </dialog>
    <dialog ref={createDialog} className="asa-drawer asa-create-dialog" aria-labelledby="asa-create-title" onCancel={(event: LegacyValue) => { if (creating) event.preventDefault(); }}>
      <form key={createFormKey} onSubmit={addAccount}>
        <div className="asa-drawer-heading"><h2 id="asa-create-title">Add Admin</h2><button type="button" disabled={creating} aria-label="Close add Admin" onClick={() => createDialog.current.close()}>&times;</button></div>
        <p>Create an account and assign its login credentials and module access.</p>
        <fieldset disabled={creating} className="asa-account-fields">
          <label>Full Name<input name="name" required maxLength={100} autoComplete="name" /></label>
          <label>Email Address<input name="email" type="email" required autoComplete="email" /></label>
          <label>Admin ID<input name="id" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_\-]{3,40}" placeholder="e.g. SA-1003" autoComplete="off" /><small>3 to 40 letters, numbers, hyphens or underscores.</small></label>
          <PasswordField label="Password" name="password" required hint="At least 8 characters." />
          <PasswordField label="Confirm Password" name="confirmPassword" required />
          <h3>Module Access</h3><small>Choose access now or edit permissions later.</small>
          <div className="asa-create-modules">{operationalPermissions.map(([key, label]: LegacyValue) => <label className="asa-checkbox" key={key}><input type="checkbox" name={key} />{label}</label>)}</div>
        </fieldset>
        {createError && <p role="alert" className="asa-error">{createError}</p>}
        <footer className="asa-drawer-footer"><button type="button" disabled={creating} onClick={() => createDialog.current.close()}>Cancel</button><button className="asa-save" disabled={creating} type="submit">{creating ? "Creating..." : "Create Admin"}</button></footer>
      </form>
    </dialog>
    <dialog ref={dialog} className="asa-drawer" onClose={()=>setEditing(null)} aria-labelledby="asa-drawer-title">{editing&&<><div className="asa-drawer-heading"><h2 id="asa-drawer-title">Edit Permissions</h2><button aria-label="Close permissions" onClick={()=>dialog.current.close()}>×</button></div><div className="asa-person"><span className="as-avatar">{editing.person.name.split(" ").map((part: LegacyValue)=>part[0]).slice(0,2).join("")}</span><div><h3>{editing.person.name}</h3><p>{editing.person.email}</p><small>{editing.person.id}</small></div><span className={`as-badge ${editing.person.status === "Active" ? "as-good" : "as-inactive"}`}>{editing.person.status}</span></div><div className="asa-tabs" role="tablist">{["Permissions","Profile","Activity Logs"].map((value: LegacyValue)=><button key={value} role="tab" aria-selected={tab===value} onClick={()=>setTab(value)}>{value}</button>)}</div>
      <div className="asa-tab-content">{tab==="Permissions"?<><h3>Module Access</h3><p>Select the modules this Admin can access.</p><div className="asa-module-list">{operationalPermissions.map(([key,label]: LegacyValue,index: LegacyValue)=><label key={key} className={key === "publicWebsite" ? "asa-public-access" : ""}><span className={`asa-module-icon as-tone-${index%6}`}><PublicIcon name={key==="publicWebsite"?"globe":key==="liveClasses"?"video":key==="certificates"?"award":"book"}/></span><span><strong>{label.replace(/^(Manage|View|Verify) /, "")}</strong><small>{key==="publicWebsite"?"Allow access to public website management tools.":(({courses:"Create and manage courses, content and categories.",liveClasses:"Manage live classes, schedules and recordings.",payments:"View and manage payments and verification.",certificates:"Manage and issue certificates.",reports:"View platform reports and analytics.",students:"Manage student accounts and information.",teachers:"Manage teachers and their profiles.",batches:"Manage course batches and schedules.",enrollments:"Manage student course enrollments.",content:"Manage lectures and learning resources.",assignments:"Manage assignments and submissions."} as LegacyValue)[key] || "Access this Learnova module.")}</small></span><input className="asa-switch" type="checkbox" role="switch" checked={editing.draft[key]===true} onChange={(event: LegacyValue)=>setEditing({...editing,draft:{...editing.draft,[key]:event.target.checked}})} aria-label={label}/></label>)}</div></>:tab==="Profile"?<SuperAdminProfileDetails key={editing.person.id} person={subAdmins.find((person: LegacyValue) => person.id === editing.person.id) || editing.person} permissions={permissions[editing.person.id]} />:<p>View available frontend activity in <Link to="/superadmin/audit-logs" onClick={()=>dialog.current.close()}>Audit Logs</Link>.</p>}</div>
      {message&&<p role="status">{message}</p>}<footer className="asa-drawer-footer"><button onClick={()=>dialog.current.close()}>Cancel</button><button className="asa-save" onClick={save}>Save Changes</button></footer></>}</dialog>
  </div>;
}
