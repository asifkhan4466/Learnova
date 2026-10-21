import type { LegacyValue } from "../../../lib/legacy-types";
import EnrollmentGroups from "../../components/EnrollmentGroups";

import PublicIcon from "../../components/PublicIcon";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import { useState } from "react";
import useBatches from "../../utils/useBatches";
import { activateBatch } from "../../utils/batchStorage";

const columns = [["name", "Batch"], ["course", "Course"], ["teacher", "Teacher"], ["students", "Students"], ["startDate", "Start Date"], ["endDate", "End Date"], ["status", "Status"]];

export default function Batches() {
  const { batches } = useBatches();
  const [message, setMessage] = useState("");
  function activate(id: LegacyValue) {
    try { activateBatch(id, "admin"); setMessage("Batch activated. The previous active batch for this course is completed."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  return <section className="admin-batches"><EnrollmentGroups role="admin" batchesOnly={true}/>
    <header className="ab-banner"><div><h1>Batches</h1><p>Manage course batches, schedules and enrollments.</p></div><blockquote>&ldquo;A good batch today<br/>builds a brighter tomorrow.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="cap"/></header>
    <div className="ab-stats">{[["Total Batches", batches.length, "book"], ["Active Batches", batches.filter((b: LegacyValue) => b.status === "Active").length, "play"], ["Upcoming Batches", batches.filter((b: LegacyValue) => b.status === "Upcoming").length, "clock"], ["Completed Batches", batches.filter((b: LegacyValue) => b.status === "Completed").length, "check"]].map(([label,value,icon]: LegacyValue,index: LegacyValue) => <article key={label} className={`ab-tone-${index}`}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>
    <div className="ab-columns"><SuperAdminRecords title="All Batches" subtitle="Review course batches, teaching assignments and schedules." rows={batches} columns={columns} action={(batch: LegacyValue) => batch.status === "Upcoming" && <button onClick={() => activate(batch.id)}>Activate Batch</button>}>{message && <p role="status">{message}</p>}</SuperAdminRecords>
    <aside><section className="ab-panel"><h2>Batch Schedule Overview</h2>{batches.filter((b: LegacyValue) => b.status !== "Completed").map((batch: LegacyValue) => <article className="ab-schedule" key={batch.id}><span className="ab-date"><PublicIcon name="clock"/></span><div><strong>{batch.name}</strong><p>{batch.course}</p><small>{batch.startDate}</small><span className="ab-status">{batch.status}</span></div></article>)}</section><section className="ab-panel"><h2>Batch Access</h2><p>Upcoming batches require Super Admin activation.</p><p>Activating a batch completes the previous active batch for the same course.</p><p>Completed batch recordings and materials remain available to assigned students.</p></section></aside></div>
  </section>;
}

