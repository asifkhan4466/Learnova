import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";
import { studentClasses, studentMaterials, studentId, joinClass } from "../../utils/batchStorage";

function LiveClasses() {
  const state = useBatches();
  const navigate = useNavigate();
  const classes = studentClasses(state);
  const materials = studentMaterials(state);
  const [message, setMessage] = useState("");
  const assigned = state.enrollments.filter((item: LegacyValue) => item.studentId === studentId);
  function join(id: LegacyValue) { try { joinClass(id); navigate(`/student/live-classes/${id}`); } catch (error: LegacyValue) { setMessage(error.message); } }

  return (
    <div className="live-classes-page">

      <div className="live-classes-header">
        <div>
          <h1>Live Classes</h1>
          <p>Attend live classes or view your upcoming scheduled classes.</p>
        </div>

        <div className="live-count">
          {classes.length} Available
        </div>
      </div>

      <div className="live-classes-list">

        {classes.map((liveClass: LegacyValue, index: LegacyValue) => (
          <div className="live-class-item" key={liveClass.id || index}>

            <div className="live-class-main">

              <div className="live-class-icon">
                ▶
              </div>

              <div className="live-class-info">

                <div className="live-class-title">
                  <h2>{liveClass.title}</h2>
                  <span>{liveClass.status === "Live" ? "Live Now" : liveClass.status}</span>
                </div>

                <p className="live-course-name">
                  {liveClass.course}
                </p>

                <div className="live-class-details">
                  <span>👨‍🏫 {liveClass.teacher}</span>
                  <span>📚 {liveClass.batch}</span>
                  <span>📅 {liveClass.date}</span>
                  <span>⏰ {liveClass.time}</span>
                  <span>⏱ {liveClass.duration}</span>
                </div>

              </div>

            </div>

            <div className="live-class-action">

              <div className="live-countdown">
                {liveClass.status === "Live" ? "Live Now" : "Scheduled"}
                <strong>{liveClass.time}</strong>
              </div>

              <button className="join-class-btn" disabled={liveClass.status !== "Live"} onClick={() => join(liveClass.id)}>
                {liveClass.status === "Live" ? "Attend Live Class" : "Not Started Yet"}
              </button>

            </div>

          </div>
        ))}

      </div>

      {message && <p role="status">{message}</p>}
      {!classes.length && <p>No live classes are available for your approved active batch.</p>}
      <section className="student-batch-history"><h2>My Batches</h2>{assigned.map((enrollment: LegacyValue) => {
        const batch = state.batches.find((item: LegacyValue) => item.id === enrollment.batchId);
        return <p key={enrollment.id}>{enrollment.course} | {batch?.name || "Awaiting assignment"} | {batch?.status || "Pending"}{!enrollment.approved || enrollment.status === "Pending" ? " | Awaiting enrollment approval" : batch?.status === "Upcoming" ? " | Waiting for Super Admin activation" : ""}</p>;
      })}<h2>Recordings, Notes & Materials</h2>{materials.map((item: LegacyValue) => <details key={item.id}><summary>{item.title} | {item.batch}</summary><p>{item.course} | {item.type} | {item.status}</p><p>{item.lecture || item.module} {item.date} {item.duration}</p><p>Saved learning record. Media files are not included in this frontend demo.</p></details>)}{!materials.length && <p>No published materials for your assigned batches.</p>}</section>
      <div className="live-class-note">
        <strong>Note:</strong>
        The Join Class button will become available when the teacher
        starts the live session.
      </div>

    </div>
  );
}

export default LiveClasses;
