import type { LegacyValue } from "../../lib/legacy-types";
﻿import { operationalPermissions, currentSubAdminId, hasPermission } from "../utils/adminPermissions";
import usePermissions from "../utils/usePermissions";

export default function AdminPermissionList(){
 const permissions=usePermissions();
 return <div className="sa-permission-list">{operationalPermissions.map(([key,label]: LegacyValue)=><div key={key}><span>{label}</span><span className="sa-status" data-status={hasPermission("subadmin",currentSubAdminId,key,permissions)?"Active":"Inactive"}>{hasPermission("subadmin",currentSubAdminId,key,permissions)?"Allowed":"Restricted"}</span></div>)}</div>;
}
