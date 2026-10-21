import type { LegacyValue } from "../../../lib/legacy-types";
﻿import { Link } from "@/lib/navigation";
import useAdminOverview from "../../utils/useAdminOverview";
import { canAccessSubAdminRoute } from "../../utils/adminPermissions";
import usePermissions from "../../utils/usePermissions";
import PublicIcon from "../../components/PublicIcon";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";
import AdminCharts from "../../components/AdminCharts";

export default function Dashboard(){
 const data=useAdminOverview(),permissions=usePermissions();
 const actions=[["students","Students","users"],["teachers","Teachers","users"],["courses","Courses","book"],["batches","Batches","cap"],["live-classes","Live Classes","video"],["payments","Verify Payments","briefcase"]].filter(([path]: LegacyValue)=>canAccessSubAdminRoute('/admin/'+path,permissions));
 return <section className="sa-page sa-dashboard"><AdminHeading title="Dashboard" subtitle="Overview of your learning platform." icon="cap"/>
 <AdminSummary items={[["Total Students",data.students.length,"users"],["Total Teachers",data.teachers.length,"users"],["Total Courses",data.courses.length,"book"],["Active Batches",data.batches.filter((b: LegacyValue)=>b.status==="Active").length,"cap"],["Total Enrollments",data.enrollments.length,"check"],["Approved Revenue",`PKR ${data.revenue.toLocaleString()}`,"database"]]}/>
 <AdminCharts courses={data.courses} enrollments={data.enrollments}/>
 <div className="sa-two-col"><section className="sa-panel"><h2>Recent Enrollment Activity</h2>{data.recentEnrollments.map((e: LegacyValue)=><div className="sa-list-row" key={e.id}><PublicIcon name="cap"/><div><strong>{e.student}</strong><small>{e.course}</small></div><span>{e.enrollmentDate}</span></div>)}</section><section className="sa-panel"><h2>Quick Actions</h2><div className="sa-quick-actions">{actions.map(([path,label,icon]: LegacyValue)=><Link key={path} to={'/admin/'+path}><PublicIcon name={icon}/><span>{label}</span></Link>)}</div>{!actions.length&&<p>Your Super Admin has not assigned operational modules yet.</p>}</section></div>
 <div className="sa-three-col"><section className="sa-panel"><h2>Top Courses</h2><div className="sa-table-wrap"><table><thead><tr><th>Course</th><th>Enrollments</th></tr></thead><tbody>{data.topCourses.map((c: LegacyValue)=><tr key={c.id}><td>{c.title}</td><td>{c.students||0}</td></tr>)}</tbody></table></div></section><section className="sa-panel"><h2>Top Teachers</h2>{[...data.teachers].sort((a: LegacyValue,b: LegacyValue)=>b.students-a.students).slice(0,5).map((t: LegacyValue)=><div className="sa-list-row" key={t.id}><div><strong>{t.name}</strong><small>{t.specialization}</small></div><span>{t.students} students</span></div>)}</section><section className="sa-panel"><h2>Learning Overview</h2><div className="sa-list-row"><div><strong>{data.completion}%</strong><small>Enrollment completion</small></div><PublicIcon name="chart"/></div><div className="sa-list-row"><div><strong>{data.payments.filter((p: LegacyValue)=>p.status==="Pending").length}</strong><small>Pending payments</small></div><PublicIcon name="briefcase"/></div><div className="sa-list-row"><div><strong>{data.courses.filter((c: LegacyValue)=>c.status==="Published").length}</strong><small>Published courses</small></div><PublicIcon name="book"/></div></section></div></section>;
}
