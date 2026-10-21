import type { LegacyValue } from "../../lib/legacy-types";
import { useRef, useState } from "react";
import { getCourses } from "../utils/courseStorage";
import { getTeachers } from "../utils/peopleStorage";
import { scheduleManagedClass } from "../utils/batchStorage";

export default function ScheduleLiveClass({ state, role = "admin", onSaved }: LegacyValue) {
  const dialog = useRef<LegacyValue>(null);
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [message, setMessage] = useState("");
  const courses = getCourses();
  const teachers = getTeachers().filter((teacher: LegacyValue) => teacher.status === "Active");
  const batches = state.batches.filter((batch: LegacyValue) => batch.status === "Active" && String(batch.courseId) === String(courseId));
  const selectedBatch = state.batches.find((batch: LegacyValue) => String(batch.id) === String(batchId));
  const assignedTeachers = teachers.filter((teacher: LegacyValue) => selectedBatch && String(teacher.id) === String(selectedBatch.teacherId));

  function submit(event: LegacyValue) {
    event.preventDefault();
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget));
      scheduleManagedClass(form, role);
      dialog.current.close();
      event.currentTarget.reset();
      setCourseId("");
      setBatchId("");
      setTeacherId("");
      setMessage("Live class scheduled. The teacher will start it when ready.");
      onSaved?.();
    } catch (error: LegacyValue) {
      setMessage(error.message);
    }
  }

  return <section className="schedule-live-class">
    <button type="button" onClick={() => { setMessage(""); setCourseId(""); setBatchId(""); setTeacherId(""); dialog.current.showModal(); }}>+ Schedule Live Class</button>
    {message && <p role="status">{message}</p>}
    <dialog ref={dialog} aria-labelledby="schedule-live-title">
      <form onSubmit={submit}>
        <h2 id="schedule-live-title">Schedule Live Class</h2>
        <label>Course<select name="courseId" required value={courseId} onChange={(event: LegacyValue) => { setCourseId(event.target.value); setBatchId(""); setTeacherId(""); }}><option value="">Select course</option>{courses.map((course: LegacyValue) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label>Batch<select name="batchId" required value={batchId} disabled={!courseId} onChange={(event: LegacyValue) => { const nextBatchId = event.target.value; const nextBatch = batches.find((batch: LegacyValue) => String(batch.id) === String(nextBatchId)); setBatchId(nextBatchId); setTeacherId(nextBatch?.teacherId || ""); }}><option value="">{courseId && !batches.length ? "No active batch available for this course" : "Select active batch"}</option>{batches.map((batch: LegacyValue) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <label>Teacher<select name="teacherId" required value={teacherId} disabled={!selectedBatch} onChange={(event: LegacyValue) => setTeacherId(event.target.value)}><option value="">Select assigned teacher</option>{assignedTeachers.map((teacher: LegacyValue) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
        <label>Lecture Title<input name="lectureTitle" required /></label>
        <label>Date<input name="date" type="date" required /></label>
        <label>Time<input name="time" type="time" required /></label>
        <label>Duration<input name="duration" defaultValue="1 Hour" required /></label>
        {message && <p role="alert">{message}</p>}
        <button type="button" onClick={() => dialog.current.close()}>Cancel</button>
        <button type="submit">Schedule Class</button>
      </form>
    </dialog>
  </section>;
}
