import type { LegacyValue } from "../../../lib/legacy-types";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";

import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";

const baseNotifications = [
  { id: "enrollment", title: "Enrollment Awaiting Review", message: "Review pending enrollment and payment details before approving course access.", type: "Enrollment / Payment" },
  { id: "live-class", title: "Live Class Scheduled", message: "A React.js live class has been scheduled for Batch 01.", type: "Live Class" },
  { id: "assignment", title: "Assignment Submissions", message: "Students have submitted the JavaScript Functions assignment for review.", type: "Assignment" },
  { id: "certificate", title: "Completion Certificates Available", message: "Completed course enrollments have certificates available in Certificates.", type: "Certificate" },
];

function Notifications({ adminView = false }: LegacyValue) {
  const state = useBatches();
  const navigate = useNavigate();
  const audience = adminView ? "admin" : "subadmin";
  const notifications = [...baseNotifications, ...(state.notifications || []).filter((item: LegacyValue) => item.audience?.includes(audience)).map((item: LegacyValue) => ({
    id: item.id, title: item.title, message: `${item.message} (${item.course} | ${item.batch})`, type: "Live Class Monitoring", timestamp: item.timestamp,
  }))];
  const [readIds, setReadIds] = useState<LegacyValue[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const unread = notifications.length - readIds.length;
  if (!adminView) return <section className="sa-page sa-notifications"><AdminHeading title="Notifications" subtitle="Manage alerts and recent learning updates." icon="clock"><button className="sa-primary" disabled={!unread} onClick={()=>setReadIds(notifications.map((n: LegacyValue)=>n.id))}>Mark All as Read</button></AdminHeading>
    <AdminSummary items={[["Unread Notifications",unread,"clock"],["Read Notifications",readIds.length,"check"],["Total Notifications",notifications.length,"book"],["Activity Types",new Set(notifications.map((n: LegacyValue)=>n.type)).size,"users"]]}/>
    <div className="sa-toolbar"><button className={!filter?"sa-primary":""} onClick={()=>setFilter("")}>All ({notifications.length})</button><button className={filter==="unread"?"sa-primary":""} onClick={()=>setFilter("unread")}>Unread ({unread})</button><button className={filter==="read"?"sa-primary":""} onClick={()=>setFilter("read")}>Read ({readIds.length})</button><input type="search" aria-label="Search notifications" placeholder="Search notifications..." value={search} onChange={(e: LegacyValue)=>setSearch(e.target.value)}/></div>
    <section className="sa-panel"><div className="sa-table-wrap"><table><thead><tr><th>Type</th><th>Notification</th><th>Status</th><th>Action</th></tr></thead><tbody>{notifications.filter((n: LegacyValue)=>(!filter||(filter==="read"?readIds.includes(n.id):!readIds.includes(n.id)))&&`${n.title} ${n.message} ${n.type}`.toLowerCase().includes(search.trim().toLowerCase())).map((n: LegacyValue)=><tr key={n.id}><td>{n.type}</td><td><strong>{n.title}</strong><p>{n.message}</p></td><td><span className="sa-status" data-status={readIds.includes(n.id)?"Read":"Unread"}>{readIds.includes(n.id)?"Read":"Unread"}</span></td><td><button disabled={readIds.includes(n.id)} onClick={()=>setReadIds((ids: LegacyValue)=>[...ids,n.id])}>Mark as Read</button></td></tr>)}</tbody></table></div><p className="sa-muted" role="status">{unread} unread notifications</p></section></section>;
  return <div className="subadmin-notifications-page">
    <header className="subadmin-notifications-header">
      <div><h1>Notifications</h1><p>Stay updated with Learnova courses, enrollments and learning activity.</p></div>
      <button type="button" disabled={!unread} onClick={() => setReadIds(notifications.map((item: LegacyValue) => item.id))}>Mark All as Read</button>
    </header>
    {adminView && <><div className="an-stats">{[["Unread Alerts", unread], ["Read Notifications", readIds.length], ["Total Notifications", notifications.length], ["Activity Types", new Set(notifications.map((item: LegacyValue) => item.type)).size]].map(([label,count]: LegacyValue, index: LegacyValue) => <article key={label} className={`an-tone-${index}`}><span className="an-stat-mark" aria-hidden="true">{["\u2709", "\u2713", "\u2637", "\u25c7"][index]}</span><div><strong>{count}</strong><p>{label}</p></div></article>)}</div><div className="an-toolbar"><h2>Recent Notifications</h2><input type="search" aria-label="Search notifications" placeholder="Search notifications..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)}/><select aria-label="Notification read status" value={filter} onChange={(event: LegacyValue) => setFilter(event.target.value)}><option value="">All Statuses</option><option value="unread">Unread</option><option value="read">Read</option></select></div></>}
    <p className="subadmin-notification-count" role="status">{unread} unread {unread === 1 ? "notification" : "notifications"}</p>
    <div className="subadmin-notifications-list">{notifications.filter((item: LegacyValue) => !adminView || ((!filter || (filter === "read" ? readIds.includes(item.id) : !readIds.includes(item.id))) && `${item.title} ${item.message} ${item.type}`.toLowerCase().includes(search.trim().toLowerCase()))).map((item: LegacyValue) => {
      const read = readIds.includes(item.id);
      return <article className={`subadmin-notification-card${read ? "" : " is-unread"}`} key={item.id}>
        <div><span className="subadmin-notification-type">{item.type}</span><h2>{item.title}</h2><p>{item.message}</p></div>
        <div>{item.classId && <button type="button" onClick={() => navigate(`${adminView ? "/superadmin" : "/admin"}/live-classes/${item.classId}`)}>Monitor Live</button>}{read ? <span className="subadmin-notification-read">Read</span> : <button type="button" aria-label={`Mark ${item.title} as read`} onClick={() => setReadIds((ids: LegacyValue) => ids.includes(item.id) ? ids : [...ids, item.id])}>Mark as Read</button>}</div>
      </article>;
    })}</div>
  </div>;
}
export default Notifications;
