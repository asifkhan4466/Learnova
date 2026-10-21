import type { LegacyValue } from "../../../lib/legacy-types";
﻿import useAdminOverview from "../../utils/useAdminOverview";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";
import AdminCharts from "../../components/AdminCharts";

export default function Reports(){
 const data=useAdminOverview();
 return <section className="sa-page"><AdminHeading title="Reports & Analytics" subtitle="Track learning performance, enrollments, and course insights." icon="chart"/><AdminSummary items={[["Total Students",data.students.length,"users"],["Total Enrollments",data.enrollments.length,"book"],["Approved Revenue",`PKR ${data.revenue.toLocaleString()}`,"database"],["Completion Rate",`${data.completion}%`,"award"]]}/><AdminCharts courses={data.courses} enrollments={data.enrollments} report/>
 <div className="sa-report-bottom"><section className="sa-panel"><h2>Recent Enrollment Activity</h2><div className="sa-table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th></tr></thead><tbody>{data.recentEnrollments.map((e: LegacyValue)=><tr key={e.id}><td>{e.student}</td><td>{e.course}</td><td>{e.enrollmentDate}</td><td><span className="sa-status" data-status={e.status}>{e.status}</span></td></tr>)}</tbody></table></div></section><section className="sa-panel"><h2>Quick Stats</h2>{[["Active Students",data.students.filter((s: LegacyValue)=>s.status==="Active").length],["Active Batches",data.batches.filter((b: LegacyValue)=>b.status==="Active").length],["Published Courses",data.courses.filter((c: LegacyValue)=>c.status==="Published").length],["Pending Payments",data.payments.filter((p: LegacyValue)=>p.status==="Pending").length]].map(([label,value]: LegacyValue)=><div className="sa-list-row" key={label}><div><strong>{value}</strong><small>{label}</small></div></div>)}</section></div></section>;
}
