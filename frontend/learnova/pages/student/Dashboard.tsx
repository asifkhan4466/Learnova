import type { LegacyValue } from "../../../lib/legacy-types";
import { useNavigate } from "@/lib/navigation";
import { Link } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";
import { studentClasses } from "../../utils/batchStorage";

function Dashboard() {
  const navigate = useNavigate();
  const state = useBatches();
  const liveClass = studentClasses(state)[0];
  const courses = [
    {
      name: "Web Development",
      teacher: "John Smith",
      progress: 75,
      status: "Active",
    },
    {
      name: "UI/UX Design",
      teacher: "Sarah Khan",
      progress: 45,
      status: "Active",
    },
    {
      name: "Python Programming",
      teacher: "Ali Ahmed",
      progress: 100,
      status: "Completed",
    },
  ];

  return (
    <div className="student-dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Welcome back, Student 👋</h1>
          <p>Continue your learning journey with Learnova.</p>
        </div>
      </div>

      <div className="dashboard-stats">

        <div className="dashboard-stat-card">
          <h3>3</h3>
          <p>Enrolled Courses</p>
        </div>

        <div className="dashboard-stat-card">
          <h3>2</h3>
          <p>Active Courses</p>
        </div>

        <div className="dashboard-stat-card">
          <h3>1</h3>
          <p>Completed Courses</p>
        </div>

        <div className="dashboard-stat-card">
          <h3>73%</h3>
          <p>Overall Progress</p>
        </div>

      </div>

      <div className="dashboard-section">

        <div className="section-title">
          <h2>My Courses</h2>
          <a href="/student/courses">View All</a>
        </div>

        <div className="student-courses-grid">

          {courses.map((course: LegacyValue, index: LegacyValue) => (
            <div className="student-course-card" key={index}>

              <div className="student-course-info">
                <h3>{course.name}</h3>
                <p>Teacher: {course.teacher}</p>
              </div>

              <div className="progress-info">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>

              <div className="course-status">
                <span>{course.status}</span>

                {course.status === "Active" && (
                  <button onClick={() => navigate("/student/courses")}>Continue Learning</button>
                )}
              </div>

            </div>
          ))}

        </div>

      </div>

      <div className="dashboard-bottom">

        <div className="upcoming-class">
          <h2>Upcoming Live Class</h2>

          <div className="live-class-card">
            {liveClass ? <><h3>{liveClass.title}</h3><p>Teacher: {liveClass.teacher}</p><p>{liveClass.date} | {liveClass.time}</p><p>{liveClass.batch} | {liveClass.duration}</p><div className="class-countdown">{liveClass.status === "Live" ? "Live Now" : "Scheduled"}</div><Link to="/student/live-classes">View Class</Link></> : <p>No live classes for your approved active batch.</p>}
          </div>
        </div>

        <div className="notifications">
          <h2>Recent Notifications</h2>

          <div className="notification-item">
            <strong>New Live Class</strong>
            <p>{liveClass ? `${liveClass.title} | ${liveClass.batch} | ${liveClass.status}` : "No live-class updates for your active batch."}</p>
          </div>

          <div className="notification-item">
            <strong>Assignment Available</strong>
            <p>A new assignment has been added.</p>
          </div>

          <div className="notification-item">
            <strong>Course Update</strong>
            <p>New lecture content is available.</p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;