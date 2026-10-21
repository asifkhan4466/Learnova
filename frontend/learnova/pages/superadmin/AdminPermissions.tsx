import type { LegacyValue } from "../../../lib/legacy-types";

import { useOutletContext } from "@/lib/navigation";
import { subAdmins, operationalPermissions } from "../../utils/adminPermissions";

function AdminPermissions() {
  const { permissions, updatePermission, message } = useOutletContext<LegacyValue>();
  return <div className="admin-permissions-page">
    <header><h1>Admin Permissions</h1><p>Assign or revoke permissions for Admin accounts.</p></header>
    {message && <p role="status">{message}</p>}
    <div className="admin-permissions-list">{subAdmins.map((person: LegacyValue) => <fieldset key={person.id} className="admin-permission-account"><legend>{person.name}</legend><p>{person.id} · {person.status}</p><div className="admin-permission-options">{operationalPermissions.map(([key, label]: LegacyValue) => <label key={key}><input type="checkbox" checked={permissions[person.id]?.[key] === true} onChange={(event: LegacyValue) => updatePermission(person.id, key, event.target.checked)} />{label}</label>)}</div></fieldset>)}</div>
  </div>;
}
export default AdminPermissions;
