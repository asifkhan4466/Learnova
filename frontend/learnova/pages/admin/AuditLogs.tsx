import type { LegacyValue } from "../../../lib/legacy-types";
﻿import { payments } from "../../data/operations";
import useBatches from "../../utils/useBatches";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";

const columns=[["date","Date / Time"],["user","User"],["module","Module"],["action","Action"],["details","Details"],["status","Status"]];
export default function AuditLogs(){
 const { classes }=useBatches();
 const rows=[...payments.map((p: LegacyValue)=>({id:p.transactionId,date:p.date,user:p.student,module:"Payments",action:"Payment submitted",details:p.transactionId,status:p.status})),...classes.map((c: LegacyValue)=>({id:c.id,date:`${c.date} ${c.time}`,user:c.teacher,module:"Live Classes",action:"Class scheduled",details:c.title,status:c.status}))];
 return <section className="sa-page sa-record-page"><SuperAdminRecords paginate filters={[["module","Modules"]]} title="Audit Logs" heading={<AdminHeading title="Audit Logs" subtitle="Review available payment and class activity records." icon="clock"/>} rows={rows} columns={columns}><AdminSummary items={[["Activity Records",rows.length,"clock"],["Users",new Set(rows.map((r: LegacyValue)=>r.user)).size,"users"],["Class Records",classes.length,"video"],["Payment Records",payments.length,"briefcase"]]}/><p className="sa-muted">Based on existing frontend records. Login, device, and permission-change history is not recorded.</p></SuperAdminRecords></section>;
}
