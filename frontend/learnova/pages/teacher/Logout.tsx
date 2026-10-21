import type { LegacyValue } from "../../../lib/legacy-types";
import { Link, useNavigate } from "@/lib/navigation";
import useProfile from "../../utils/useProfile";
import { teacherId } from "../../utils/batchStorage";
import { teachers } from "../../data/operations";
import PublicIcon from "../../components/PublicIcon";

export default function Logout() {
 const saved = useProfile(teacherId);
 const profile = {...teachers.find((teacher: LegacyValue)=>teacher.id===teacherId),...saved};
 const navigate = useNavigate();
 return <section className="tlo-page"><header><h1>Logout</h1><p>You&apos;re about to leave your teacher account.</p></header><section className="tlo-card"><div className="tlo-symbol"><PublicIcon name="arrow-right"/></div><h2>Sign Out?</h2><p>Are you sure you want to logout from your teacher account?</p><p className="tlo-subtitle">You can sign in again to access your courses, classes and resources.</p><div className="tlo-profile"><span className="tlo-avatar">{profile.image ? <img src={profile.image} alt="My profile"/> : profile.name.charAt(0)}</span><div><h3>{profile.name}</h3><p>{profile.specialization || "Teacher"}</p><div className="tlo-contact"><span>{profile.email}</span>{profile.phone&&<span>{profile.phone}</span>}</div></div></div><div className="tlo-notice"><PublicIcon name="clock"/><div><strong>Before you go...</strong><p>Make sure you have saved any changes to your work.</p></div></div><footer><Link to="/teacher/dashboard">Cancel</Link><button onClick={()=>navigate("/login/teacher",{replace:true})}>Logout</button></footer></section></section>;
}
