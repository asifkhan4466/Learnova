import type { LegacyValue } from "../../../lib/legacy-types";

import PublicIcon from "../../components/PublicIcon";
import { useState } from "react";
import { Link, useOutletContext } from "@/lib/navigation";
import { subAdmins, publicPermissions, canManagePublicContent } from "../../utils/adminPermissions";

function PublicContent() {
  const { permissions, updatePermission, message } = useOutletContext<LegacyValue>();
  const [selectedId, setSelectedId] = useState(subAdmins[0].id);
  const enabled = canManagePublicContent("subadmin", selectedId, undefined, permissions);
  return <div className="admin-public-content">
    <header><div><h1>Public Website Control</h1><p>Choose which public-content permissions a Admin may use.</p></div><PublicIcon name="globe"/></header>
    <div className="apc-summary"><PublicIcon name="target"/><div><h2>Public Content Access</h2><p>Super Admin controls access. Admin accounts cannot grant themselves permissions.</p></div><span className={enabled ? "apc-enabled" : "apc-disabled"}>{enabled ? "Website access enabled" : "Website access disabled"}</span></div>
    <section className="admin-public-content-card">
      <label className="admin-public-account">Admin<select value={selectedId} onChange={(event: LegacyValue) => setSelectedId(event.target.value)}>{subAdmins.map((person: LegacyValue) => <option key={person.id} value={person.id}>{person.name} ({person.id})</option>)}</select></label>
      {!enabled && <p>Enable Manage Public Website in <Link to="/superadmin/subadmin-permissions">Admin Permissions</Link> to assign these permissions.</p>}
      <fieldset disabled={!enabled}><legend>Public content permissions</legend>{publicPermissions.map(([key, label]: LegacyValue) => <label key={key}><input role="switch" type="checkbox" checked={canManagePublicContent("subadmin", selectedId, key, permissions)} onChange={(event: LegacyValue) => updatePermission(selectedId, key, event.target.checked)} />{label}</label>)}</fieldset>
      <p>Permission setup only. Content editing tools are not included in this step.</p>
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
export default PublicContent;
