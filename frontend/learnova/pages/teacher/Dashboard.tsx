import type { LegacyValue } from "../../../lib/legacy-types";
import { Link } from "@/lib/navigation";
import PublicIcon from "../../components/PublicIcon";
import useCourses from "../../utils/useCourses";
import useBatches from "../../utils/useBatches";
import { classStatus, teacherClasses, teacherBatches, teacherCourses, teacherStudents } from "../../utils/batchStorage";


export default function Dashboard() {
  const catalog = useCourses();
  const state = useBatches();
  const batches = teacherBatches(state) || [];
  const students = teacherStudents(state) || [];
  const rawClasses = teacherClasses(state) || [];
  const courses = teacherCourses(catalog) || [];
  const classes = rawClasses.map((item: LegacyValue) => ({ ...item, status: classStatus(item, state) }));

  const parseDateTime = (d: LegacyValue, t: LegacyValue) => {
    const parsed = new Date(`${d || ""} ${t || ""}`).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const liveClass = classes.find((item: LegacyValue) => item?.status === "Live") ||
    classes.filter((item: LegacyValue) => item?.status === "Scheduled").sort((a: LegacyValue, b: LegacyValue) => parseDateTime(a?.date, a?.time) - parseDateTime(b?.date, b?.time))[0];

  const stats = [
    ["My Courses", courses.length, "Assigned Courses", "book"],
    ["My Batches", batches.filter((batch: LegacyValue) => batch?.status === "Active").length, "Active Batches", "layers"],
    ["Students", new Set(students.map((student: LegacyValue) => student?.studentId).filter(Boolean)).size, "Total Students", "users"],
    ["Upcoming Live Classes", classes.filter((item: LegacyValue) => item?.status === "Scheduled").length, "Next Sessions", "play"],
  ];

  return (
    <section className="teacher-dashboard">
      <header className="td-heading">
        <h1>Teacher Dashboard</h1>
        <p>Manage your courses, batches, students and live classes.</p>
      </header>
      <div className="td-stats">
        {stats.map(([title, value, label, icon]: LegacyValue, index: LegacyValue) => (
          <article key={title}>
            <span className={`td-icon td-tone-${index}`}><PublicIcon name={icon}/></span>
            <div>
              <p>{title}</p>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </article>
        ))}
      </div>
      <section className="td-section">
        <header>
          <div>
            <h2>{liveClass?.status === "Live" ? "Live Class" : "Upcoming Live Class"}</h2>
            <p>Your next scheduled live session.</p>
          </div>
          <Link to="/teacher/live-classes">View All</Link>
        </header>
        {liveClass ? (
          <article className="td-live">
            <span className="td-icon"><PublicIcon name="play"/></span>
            <div className="td-live-info">
              <h3>{liveClass.title || liveClass.lectureTitle || "Live Lecture"}</h3>
              <p>{liveClass.course || liveClass.courseTitle || "Assigned Course"}</p>
              <div className="td-meta">
                <span><PublicIcon name="users"/>{liveClass.batch || liveClass.batchName || "Assigned Batch"}</span>
                <span><PublicIcon name="calendar"/>{liveClass.date || "Scheduled"}</span>
                <span><PublicIcon name="clock"/>{liveClass.time || ""}</span>
              </div>
            </div>
            <div className="td-live-action">
              <span className="td-status">{liveClass.status === "Live" ? "Live Now" : "Scheduled"}</span>
              <Link className="td-primary" to="/teacher/live-classes">Go to Class</Link>
            </div>
          </article>
        ) : (
          <div className="td-empty">No scheduled classes for your active assigned batches.</div>
        )}
      </section>
      <section className="td-section">
        <header>
          <div>
            <h2>My Courses</h2>
            <p>Courses currently assigned to you.</p>
          </div>
          <Link to="/teacher/courses">View All</Link>
        </header>
        <div className="td-courses">
          {courses.slice(0, 3).map((course: LegacyValue) => {
            if (!course) return null;
            const courseId = course.id;
            const assigned = batches.filter((batch: LegacyValue) => batch && String(batch.courseId) === String(courseId));
            const roster = students.filter((student: LegacyValue) => student && String(student.courseId) === String(courseId));
            const validRoster = roster.filter((student: LegacyValue) => student && Number.isFinite(Number(student.progress)));
            const progress = validRoster.length
              ? Math.round(validRoster.reduce((sum: LegacyValue, student: LegacyValue) => sum + Number(student.progress || 0), 0) / validRoster.length)
              : 0;
            const status = assigned.some((batch: LegacyValue) => batch?.status === "Active")
              ? "Active"
              : assigned.some((batch: LegacyValue) => batch?.status === "Upcoming")
              ? "Upcoming"
              : assigned.length
              ? "Completed"
              : (course.status || "Draft");
            const uniqueStudents = new Set(roster.map((student: LegacyValue) => student?.studentId).filter(Boolean)).size;
            return (
              <article key={courseId}>
                <div className="td-course-title">
                  <h3>{course.title || "Assigned Course"}</h3>
                  <span className="td-status" data-status={status}>{status}</span>
                </div>
                <p>{assigned.map((batch: LegacyValue) => batch?.name).filter(Boolean).join(", ") || "No assigned batches"}</p>
                <div className="td-meta">
                  <span><PublicIcon name="users"/>{uniqueStudents} Students</span>
                  <span><PublicIcon name="calendar"/>{assigned.length} Assigned Batches</span>
                </div>
                <div className="td-progress-label">
                  <span>Student Progress</span>
                  <strong>{progress}%</strong>
                </div>
                <progress value={progress} max="100" aria-label={`${course.title || "Course"} student progress`}/>
                <Link to="/teacher/courses">View Course</Link>
              </article>
            );
          })}
        </div>
        {!courses.length && <div className="td-empty">No courses assigned yet.</div>}
      </section>
    </section>
  );
}
