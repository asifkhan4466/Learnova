import type { LegacyValue } from "../../lib/legacy-types";
import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/navigation";


function elapsedLabel(startedAt: LegacyValue, now: LegacyValue) {
  if (!startedAt) return "00:00:00";
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function LiveNowPanel({ classes, routePrefix }: LegacyValue) {
  const navigate = useNavigate();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!classes.length) return null;
  return <section className="live-now-panel" aria-labelledby="live-now-heading">
    <div className="live-now-heading"><div><span className="live-now-kicker">LIVE NOW</span><h2 id="live-now-heading">Teacher sessions currently running</h2></div><strong>{classes.length} live</strong></div>
    <div className="live-now-grid">{classes.map((item: LegacyValue) => <article className="live-now-card" key={item.id}>
      <div className="live-now-card-top"><span className="live-now-badge">LIVE</span><span>{elapsedLabel(item.startedAt || item.actualStartTime, now)}</span></div>
      <h3>{item.lectureTitle || item.title}</h3>
      <dl><div><dt>Course</dt><dd>{item.course}</dd></div><div><dt>Teacher</dt><dd>{item.teacher}</dd></div><div><dt>Batch</dt><dd>{item.batch}</dd></div><div><dt>Started</dt><dd>{item.time || new Date(item.startedAt || item.actualStartTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</dd></div><div><dt>Participants</dt><dd>{(item.participants || []).filter((participant: LegacyValue) => !participant.leftAt && participant.role === "Student").length}</dd></div></dl>
      <button type="button" onClick={() => navigate(`${routePrefix}/${item.id}`)}>Monitor Live</button>
    </article>)}</div>
  </section>;
}
