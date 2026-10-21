import type { LegacyValue } from "../../../lib/legacy-types";
import { useNavigate } from "@/lib/navigation";

function Progress() {
  const navigate = useNavigate();
  const courses = [
    {
      name: "Web Development",
      teacher: "John Smith",
      progress: 75,
      completed: "18 / 24",
      status: "In Progress",
    },
    {
      name: "UI/UX Design",
      teacher: "Sarah Khan",
      progress: 45,
      completed: "9 / 20",
      status: "In Progress",
    },
    {
      name: "Python Programming",
      teacher: "Ali Ahmed",
      progress: 100,
      completed: "16 / 16",
      status: "Completed",
    },
  ];

  return (
    <div className="progress-page">

      <div className="progress-header">
        <div>
          <h1>My Progress</h1>
          <p>Track your learning progress across all enrolled courses.</p>
        </div>
      </div>

      <div className="progress-summary">

        <div className="progress-summary-card">
          <span>Total Courses</span>
          <strong>{courses.length}</strong>
        </div>

        <div className="progress-summary-card">
          <span>In Progress</span>
          <strong>2</strong>
        </div>

        <div className="progress-summary-card">
          <span>Completed</span>
          <strong>1</strong>
        </div>

        <div className="progress-summary-card">
          <span>Overall Progress</span>
          <strong>73%</strong>
        </div>

      </div>

      <div className="course-progress-section">

        <h2>Course Progress</h2>

        <div className="course-progress-list">

          {courses.map((course: LegacyValue, index: LegacyValue) => (
            <div className="course-progress-card" key={index}>

              <div className="course-progress-top">

                <div>
                  <h3>{course.name}</h3>
                  <p>Instructor: {course.teacher}</p>
                </div>

                <span
                  className={
                    course.status === "Completed"
                      ? "progress-completed"
                      : "progress-active"
                  }
                >
                  {course.status}
                </span>

              </div>

              <div className="progress-bar-info">
                <span>Course Progress</span>
                <strong>{course.progress}%</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>

              <div className="progress-bottom">
                <span>
                  Lessons Completed: {course.completed}
                </span>

                <button className="progress-view-btn" onClick={() => navigate("/student/courses")}>
                  View Course
                </button>
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

export default Progress;