import type { LegacyValue } from "../../../lib/legacy-types";
import { currentSubAdminId, logoutSubAdmin, subAdmins } from "../../utils/adminPermissions";
import { Link } from "@/lib/navigation";
import useProfile from "../../utils/useProfile";
import PublicIcon from "../../components/PublicIcon";
import { AdminHeading } from "../../components/AdminSummary";

export default function Logout(){
 const profile=useProfile(currentSubAdminId);
 return <section className="sa-page"><AdminHeading title="Logout" subtitle="Leave your Admin portal and return to login." icon="arrow"/><div className="sa-logout-grid"><section className="sa-panel sa-logout-confirm"><span className="sa-logout-icon"><PublicIcon name="arrow"/></span><h2>Are you sure you want to log out?</h2><p>You will be redirected to the login page.</p><Link className="sa-button sa-primary" to="/login/admin" onClick={logoutSubAdmin} replace>Logout</Link><Link className="sa-button" to="/admin/dashboard">Cancel</Link></section><div><section className="sa-panel"><h2>Current Account</h2><div className="sa-list-row"><span>User</span><div/><strong>{profile.name||subAdmins.find((person: LegacyValue)=>person.id===currentSubAdminId)?.name||"Admin"}</strong></div><div className="sa-list-row"><span>Role</span><div/><strong>Administrator</strong></div><div className="sa-list-row"><span>Account ID</span><div/><strong>{currentSubAdminId}</strong></div></section><section className="sa-panel"><h2>Security Tips</h2><p>Keep your account details private and use your own device when possible.</p><p>Contact your super administrator if your profile or assigned access looks incorrect.</p></section></div></div></section>;
}
