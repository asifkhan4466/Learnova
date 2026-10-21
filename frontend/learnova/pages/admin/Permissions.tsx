import type { LegacyValue } from "../../../lib/legacy-types";
import PublicSectionsEditor from "../../components/PublicSectionsEditor";
import { loginRoles } from "../auth/loginRoles";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";
import AdminPermissionList from "../../components/AdminPermissionList";
import { operationalPermissions, currentSubAdminId, hasPermission } from "../../utils/adminPermissions";
import usePermissions from "../../utils/usePermissions";

export default function Permissions(){
 const permissions=usePermissions(),allowed=operationalPermissions.filter(([key]: LegacyValue)=>hasPermission("subadmin",currentSubAdminId,key,permissions)).length;
 return <section className="sa-page"><AdminHeading title="Permissions" subtitle="View your assigned module access and account authority." icon="target"/><AdminSummary items={[["Total Roles",loginRoles.length,"users"],["Allowed Modules",allowed,"check"],["Restricted Modules",operationalPermissions.length-allowed,"close"],["Available Modules",operationalPermissions.length,"book"]]}/>
 <section className="sa-panel"><h2>Role &amp; Access</h2><div className="sa-table-wrap"><table><thead><tr><th>Role</th><th>Description</th><th>Permission Authority</th><th>Status</th></tr></thead><tbody>{loginRoles.map((role: LegacyValue)=><tr key={role.id}><td><strong>{role.name}</strong></td><td>{role.id === "admin" ? "Full platform access." : role.id === "subadmin" ? "Limited access to assigned modules." : role.id === "teacher" ? "Own courses, students, and classes." : "Enrolled courses and learning materials."}</td><td>{role.id === "admin" ? "Highest authority" : "Controlled by Super Admin"}</td><td><span className="sa-status" data-status="Active">Available</span></td></tr>)}</tbody></table></div></section>
 <section className="sa-panel sa-permissions-overview"><h2>Module Permissions Overview</h2><p>Your Super Admin assigns or revokes access. These permissions are read-only.</p><AdminPermissionList/></section><PublicSectionsEditor/></section>;
}
