import type { LegacyValue } from "../../../lib/legacy-types";
import PublicIcon from "../../components/PublicIcon";
import { useRef, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";
import useCourses from "../../utils/useCourses";
import { classStatus, teacherClasses, teacherBatches, teacherCourses, startClass, startManualClass, uploadLectureMaterial } from "../../utils/batchStorage";

function LiveClasses() {
  const state = useBatches();
  const catalog = useCourses();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Record<string, LegacyValue>>({ courseId: "", batchId: "", lectureTitle: "", duration: "" });
  const [material, setMaterial] = useState<LegacyValue>(null);
  const current = teacherClasses(state).map((item: LegacyValue) => ({ ...item, status: classStatus(item, state) }));
  const completed = current.filter((item: LegacyValue) => item.status === "Completed");
  const [tab,setTab] = useState("Scheduled");
  const liveClasses = tab === "Completed" ? completed : current.filter((item: LegacyValue) => item.status === tab);
  const [message, setMessage] = useState("");
  const startingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);
  function start(id: LegacyValue) { try { startClass(id); navigate(`/teacher/live-classes/${id}`); } catch (error: LegacyValue) { setMessage(error.message); } }
  const assignedCourses = teacherCourses(catalog);
  const assignedBatches = teacherBatches(state);
  const availableBatches = assignedBatches.filter((item: LegacyValue) => String(item.courseId) === String(form.courseId) && item.status === "Active" && item.approvedBy);
  function openCreate() {
    setMessage("");
    setForm({ courseId: assignedCourses[0]?.id || "", batchId: "", lectureTitle: "", duration: "" });
    setMaterial(null);
    setShowCreate(true);
  }
  async function create(event: LegacyValue) {
    event.preventDefault();
    if (startingRef.current) return;
    startingRef.current = true;
    setIsStarting(true);
    setMessage("");
    try {
      const created = startManualClass(form);
      if (material) await uploadLectureMaterial(created.id, material);
      setShowCreate(false);
      navigate(`/teacher/live-classes/${created.id}`);
    } catch (error: LegacyValue) {
      setMessage(error.message);
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }

  return (
    <div className="teacher-live-classes-page">

      <div className="teacher-live-classes-header">
        <div>
          <h1>Live Classes</h1>
          <p>Start your scheduled classes when you are ready. Eligible batch students are notified automatically.</p>
        </div>
        <button className="teacher-create-live-btn" onClick={openCreate}>+ Start New Live Class</button>
      </div>

      {showCreate && <dialog className="teacher-live-dialog" open>
        <form onSubmit={create}>
          <h2>Start New Live Class</h2>
          <label>Course<select required value={form.courseId} onChange={(event: LegacyValue) => setForm((value: LegacyValue) => ({ ...value, courseId: event.target.value, batchId: "" }))}><option value="">Select a course</option>{assignedCourses.map((course: LegacyValue) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label>Batch<select required value={form.batchId} onChange={(event: LegacyValue) => setForm((value: LegacyValue) => ({ ...value, batchId: event.target.value }))} disabled={!form.courseId}><option value="">Select a batch</option>{availableBatches.map((batch: LegacyValue) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
          <label>Lecture Title<input required value={form.lectureTitle} onChange={(event: LegacyValue) => setForm((value: LegacyValue) => ({ ...value, lectureTitle: event.target.value }))} placeholder="e.g. React Hooks Workshop" /></label>
          <label>Duration<input required value={form.duration} onChange={(event: LegacyValue) => setForm((value: LegacyValue) => ({ ...value, duration: event.target.value }))} placeholder="e.g. 1 Hour" /></label>
          <label>Optional Material<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" onChange={(event: LegacyValue) => setMaterial(event.target.files[0] || null)} /></label>
          {message && <p className="teacher-dialog-error" role="status" style={{ color: "#ef4444", margin: "0.5rem 0" }}>{message}</p>}
          <div><button type="submit" disabled={isStarting}>{isStarting ? "Starting..." : "Start Live Class"}</button><button type="button" disabled={isStarting} onClick={() => { setShowCreate(false); setMessage(""); }}>Cancel</button></div>
        </form>
      </dialog>}

      <div className="teacher-live-summary">{[["Live Now",current.filter((item: LegacyValue)=>item.status==="Live").length,"play"],["Scheduled",current.filter((item: LegacyValue)=>item.status==="Scheduled").length,"calendar"],["Completed",completed.length,"check"]].map(([label,value,icon]: LegacyValue)=><article className="teacher-live-summary-card" key={label}><PublicIcon name={icon}/><div><strong>{value}</strong><span>{label}</span></div></article>)}</div>
      <nav className="tlc-tabs" aria-label="Class status">{[["Scheduled","Upcoming Classes"],["Live","Live Now"],["Completed","Completed"]].map(([value,label]: LegacyValue)=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</nav>
      <div className="teacher-live-class-list">

        {liveClasses.map((liveClass: LegacyValue) => (
          <div className="teacher-live-class-card" key={liveClass.id}>

            <div className="teacher-live-class-icon"><PublicIcon name="play"/></div>
            <div className="teacher-live-class-info">

              <div className="teacher-live-class-title">
                <h2>{liveClass.title}</h2>

                <span className="teacher-live-upcoming">
                  {liveClass.status}
                </span>
              </div>

              <p>{liveClass.course}</p>

              <div className="teacher-live-class-details"><span><PublicIcon name="users"/>{liveClass.batch}</span><span><PublicIcon name="calendar"/>{liveClass.date}</span><span><PublicIcon name="clock"/>{liveClass.time}</span><span>{liveClass.duration}</span></div>

            </div>

            <div className="teacher-live-class-actions">

              <button className="teacher-live-view-btn" onClick={() => liveClass.status === "Live" || liveClass.status === "Completed" ? navigate(`/teacher/live-classes/${liveClass.id}`) : setMessage(`${liveClass.title} | ${liveClass.batch} | ${liveClass.date} ${liveClass.time} | ${liveClass.status}`)}>
                View
              </button>

              <button className="teacher-live-start-btn" onClick={() => liveClass.status === "Scheduled" ? start(liveClass.id) : navigate(`/teacher/live-classes/${liveClass.id}`)}>
                {liveClass.status === "Live" ? "Join / Open Live Class" : liveClass.status === "Completed" ? "View Recording" : "Start Class"}
              </button>

            </div>

          </div>
        ))}

      </div>

      <aside className="tlc-notice"><PublicIcon name="bell"/><div><strong>You control when your live class starts.</strong><p>Starting a class notifies approved students in that assigned batch.</p></div></aside>
      {message && <p role="status">{message}</p>}
      {!liveClasses.length && <p>No classes in this category.</p>}

    </div>
  );
}

export default LiveClasses;
