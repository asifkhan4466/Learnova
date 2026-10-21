import type { LegacyValue } from "../../../lib/legacy-types";
import { Link } from "@/lib/navigation";
import PublicIcon from "../../components/PublicIcon";
import { payments } from "../../data/operations";
import useBatches from "../../utils/useBatches";

import useCourses from "../../utils/useCourses";
import { subAdmins } from "../../utils/adminPermissions";

function Dashboard() {
  const courses = useCourses();
  const state = useBatches();
  const stats = [
    ["Total Students", 248], ["Total Teachers", 18], ["Total Admins", subAdmins.length],
    ["Total Courses", courses.length], ["Active Batches", state.batches.filter((batch: LegacyValue) => batch.status === "Active").length], ["Pending Payments", 12],
    ["Active Live Classes", state.classes.filter((item: LegacyValue) => item.status === "Live" && state.batches.some((batch: LegacyValue) => batch.id === item.batchId && batch.status === "Active")).length], ["Completed Courses", 86], ["Certificates Issued", 74],
  ];
  const icons = ["users", "users", "briefcase", "book", "database", "briefcase", "video", "check", "award"];
  const activeClasses = state.classes.filter((item: LegacyValue) => ["Scheduled", "Live"].includes(item.status) && state.batches.some((batch: LegacyValue) => batch.id === item.batchId && batch.status === "Active"));
  const completion = [
    ["Completed", state.enrollments.filter((item: LegacyValue) => item.status === "Completed").length],
    ["In Progress", state.enrollments.filter((item: LegacyValue) => item.status === "Active").length],
    ["Pending", state.enrollments.filter((item: LegacyValue) => !["Active", "Completed"].includes(item.status)).length],
  ];
  const total = state.enrollments.length;
  const rate = total ? Math.round(completion[0][1] / total * 100) : 0;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = Math.max(new Date().getFullYear(), ...state.enrollments.map((item: LegacyValue) => new Date(item.enrollmentDate).getFullYear()).filter(Number.isFinite));
  const monthly = months.map((_: LegacyValue, month: LegacyValue) => state.enrollments.filter((item: LegacyValue) => { const date = new Date(item.enrollmentDate); return date.getFullYear() === year && date.getMonth() <= month; }).length);
  const max = Math.max(...monthly, 1);
  const points = monthly.map((value: LegacyValue, i: LegacyValue) => `${35 + i * 29},${155 - value / max * 120}`).join(" ");
  const curve = monthly.map((value: LegacyValue, i: LegacyValue) => {
    const x = 35 + i * 29, y = 155 - value / max * 120;
    if (!i) return `M${x},${y}`;
    const previousY = 155 - monthly[i - 1] / max * 120;
    return `C${x - 14.5},${previousY} ${x - 14.5},${y} ${x},${y}`;
  }).join(" ");
  const pending = payments.filter((item: LegacyValue) => item.status === "Pending");
  return <div className="admin-dashboard">
    <header className="ad-welcome"><div><h1>Super Admin Dashboard</h1><p>Monitor your platform, manage content, and empower learners worldwide.</p></div><div className="ad-welcome-art"><span className="ad-banner-quote">Education is the most powerful weapon<br />which you can use to change the world.<small>- Nelson Mandela</small></span><svg className="ad-banner-cap" viewBox="0 0 180 110" aria-hidden="true"><defs><linearGradient id="ad-cap-top" x2="1" y2="1"><stop stopColor="#a8baff"/><stop offset="1" stopColor="#0062ff"/></linearGradient><linearGradient id="ad-cap-base"><stop stopColor="#183ceb"/><stop offset="1" stopColor="#70a5ff"/></linearGradient></defs><ellipse cx="96" cy="99" rx="57" ry="8" fill="#bedaff"/><path d="M51 49L130 49 130 87Q91 112 51 85Z" fill="url(#ad-cap-base)"/><path d="M8 40L81 5 169 21 102 63Z" fill="url(#ad-cap-top)"/><path d="M8 40L102 63 169 21" fill="none" stroke="#afceff" strokeWidth="3"/><path d="M101 39L143 47 143 90" fill="none" stroke="#0062ff" strokeWidth="4"/><path d="M140 85L147 85 150 105 137 105Z" fill="#0062ff"/></svg><span className="ad-banner-motto">More Learners<small>A Brighter Tomorrow</small><i /></span></div></header>
    <div className="admin-dashboard-stats">{stats.map(([label, value]: LegacyValue, index: LegacyValue) => label === "Completed Courses" ? null : <article key={label} className={`ad-tone-${index}`}><div className="ad-stat-icon"><PublicIcon name={icons[index]} /></div><div><strong>{value}</strong><span>{label}</span><small>{label === "Active Live Classes" && value > 0 ? "Live now" : "Platform overview"}</small></div><svg className="ad-stat-chart" viewBox="25 20 340 145" aria-hidden="true"><path d={`${curve} L354,155 L35,155 Z`} className="ad-spark-area" /><path d={curve} className="ad-spark-line" /></svg></article>)}</div>
    <div className="ad-content-grid">
      <section className="ad-panel ad-enrollment"><div className="ad-panel-heading"><h2>Student Enrollments</h2><span>{year}</span></div><p className="ad-chart-caption">Cumulative enrollment records</p><svg viewBox="0 0 380 195" role="img" aria-label={`Cumulative enrollments for ${year}: ${monthly.map((value: LegacyValue,i: LegacyValue) => `${months[i]} ${value}`).join(", ")}`}>
        {[0,1,2,3].map((i: LegacyValue) => <g key={i}><line x1="35" x2="354" y1={155-i*40} y2={155-i*40} className="ad-grid-line" /><text x="24" y={159-i*40} textAnchor="end">{Math.round(max*i/3)}</text></g>)}
        <polygon points={`35,155 ${points} 354,155`} className="ad-chart-area" /><path d={curve} className="ad-chart-line" />{months.map((month: LegacyValue,i: LegacyValue) => <text key={month} x={35+i*29} y="179" textAnchor="middle">{month}</text>)}
      </svg></section>
      <section className="ad-panel"><div className="ad-panel-heading"><h2>Course Completion Snapshot</h2><span>Enrollments</span></div><div className="ad-completion"><div className="ad-donut" style={{ background: `conic-gradient(var(--learnova-blue) 0 ${rate}%, var(--learnova-cyan) ${rate}% ${total ? (completion[0][1]+completion[1][1])/total*100 : 0}%, var(--learnova-purple) 0)` }} role="img" aria-label={`${rate}% completed`}><div><strong>{rate}%</strong><span>Completion<br />Rate</span></div></div><ul className="ad-legend">{completion.map(([label,count]: LegacyValue,i: LegacyValue) => <li key={label} className={`ad-legend-${i}`}><span><i />{label}</span><strong>{count}</strong></li>)}<li className="ad-enrollment-total"><PublicIcon name="cap" /><span><strong>{total}</strong>Total Enrollments</span></li></ul></div><p className="ad-chart-caption">{stats[7][1]} Completed Courses | Platform overview</p></section>
      <section className="ad-panel"><div className="ad-panel-heading"><h2>Live Classes Overview</h2><Link to="/superadmin/live-classes">View All</Link></div><div className="ad-live-list">{activeClasses.slice(0,3).map((item: LegacyValue) => <article key={item.id}><span className="ad-live-marker"><PublicIcon name={item.status === "Live" ? "video" : "clock"} />{item.status}</span><div><strong>{item.title}</strong><small>{item.date} | {item.time}</small><small>Teacher: {item.teacher}</small><small>{item.batch}</small></div><Link to="/superadmin/live-classes">View</Link></article>)}{!activeClasses.length && <p className="ad-empty">No active or scheduled classes.</p>}</div></section>
      <section className="ad-panel admin-recent-activity"><div className="ad-panel-heading"><h2>Recent Activity</h2><Link to="/superadmin/audit-logs">View All</Link></div><ul className="ad-activity-list">{[["users","Student enrollment requests","Enrollment requests are awaiting review."],["briefcase","Payment submissions","Payment submissions are pending verification."],["video","Live class schedule","Review the current batch teaching schedule."]].map(([icon,title,text]: LegacyValue) => <li key={title}><span className="ad-activity-icon"><PublicIcon name={icon} /></span><div><strong>{title}</strong><small>{text}</small></div></li>)}</ul></section>
      <section className="ad-panel admin-dashboard-summary"><div className="ad-panel-heading"><h2>Pending Payments</h2><Link to="/superadmin/payments">View All</Link></div><ul className="ad-payments">{pending.slice(0,4).map((item: LegacyValue) => <li key={item.transactionId}><span className="ad-initials">{item.student.split(" ").map((part: LegacyValue) => part[0]).join("")}</span><div><strong>{item.student}</strong><small>{item.course} | {item.batch}</small></div><b>{item.amount}</b><Link to="/superadmin/payments">Review</Link></li>)}</ul></section>
      <section className="ad-panel"><div className="ad-panel-heading"><h2>Operational Overview</h2><Link to="/superadmin/reports">Reports</Link></div><div className="ad-operations">{[["book",courses.filter((item: LegacyValue) => item.status === "Published").length,"Published Courses"],["database",state.batches.length,"Total Batches"],["cap",state.materials.length,"Learning Materials"],["briefcase",subAdmins.length,"Admins"]].map(([icon,value,label]: LegacyValue) => <div key={label}><PublicIcon name={icon} /><strong>{value}<small>{label}</small></strong></div>)}</div></section>
    </div>
    <footer className="ad-footer"><span><PublicIcon name="cap" /> Learnova Administration</span><span>Learn. Grow. Achieve.</span></footer>
  </div>;
}
export default Dashboard;

