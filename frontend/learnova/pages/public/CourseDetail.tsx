import type { LegacyValue } from "../../../lib/legacy-types";
import useCourses from "../../utils/useCourses";

import { useLocation, useNavigate } from "@/lib/navigation";
import { getPublishedCourse } from "../../utils/courseStorage";

function CourseDetail() {
  const navigate = useNavigate();
  useCourses();
  const location = useLocation();
  const { pathname } = location;
  const course: LegacyValue = getPublishedCourse(pathname.split("/").filter(Boolean).at(-1));
  if (!course) return <main className="course-detail-page"><section className="course-detail-header"><div className="course-detail-header-content"><h1>Course unavailable</h1><p>This course is not currently published.</p></div></section></main>;
  const curriculum = course.curriculum || [];
  const outcomes = course.outcomes || [];
  const lessons = curriculum.reduce((total: LegacyValue, module: LegacyValue) => total + (Number(module.lectures) || 0), 0);
  const discount = course.oldPrice > course.price ? Math.round((1 - course.price / course.oldPrice) * 100) : 0;
  return (
    <main className="course-detail-page">

      <section className="course-detail-header">
        <div className="course-detail-header-content">

          <span className="course-category">
            {course.category}
          </span>

          <h1>{course.title}</h1>

          <p>
            {course.summary}
          </p>

          <div className="course-detail-meta">
            <span>⭐ {course.rating}</span>
            <span>{course.instructor}</span>
            <span>{course.duration}</span>
            <span>{course.level}</span>
          </div>

        </div>
      </section>


      <section className="course-detail-content">

        <div className="course-main">

          <img
            className="course-detail-image"
            src={course.image || "/Logo.png"}
            alt={course.title}
          />

          <div className="course-section">
            <h2>Course Description</h2>

            <p>
              {course.description}
            </p>
          </div>


          <div className="course-section">
            <h2>What You&apos;ll Learn</h2>

            <div className="learning-list">
              {outcomes.map((outcome: LegacyValue) => <p key={outcome}>✓ {outcome}</p>)}
            </div>
          </div>


          <div className="course-section">
            <h2>Course Curriculum</h2>

            {curriculum.map((module: LegacyValue, index: LegacyValue) => (
              <div className="curriculum-item" key={module.title}>
                <div>
                  <h3>Module {index + 1} — {module.title}</h3>
                  <p>{module.lectures} Lectures</p>
                </div>
                <span>›</span>
              </div>
            ))}

          </div>


          <div className="course-section">
            <h2>Requirements</h2>

            <p>
              {course.requirements}
            </p>
          </div>

        </div>


        <aside className="enrollment-card">

          <div className="enrollment-price">
            <span className="discount-price">PKR {course.price}</span>
            <span className="original-price">PKR {course.oldPrice}</span>
          </div>

          <p className="discount-label">
            {discount}% OFF
          </p>

          <div className="enrollment-info">
            <div>
              <span>Duration</span>
              <strong>{course.duration}</strong>
            </div>

            <div>
              <span>Lessons</span>
              <strong>{lessons}</strong>
            </div>

            <div>
              <span>Level</span>
              <strong>{course.level}</strong>
            </div>

            <div>
              <span>Certificate</span>
              <strong>{course.certificate ? "Yes" : "No"}</strong>
            </div>
          </div>

          <button onClick={() => navigate(location.state?.enrollmentPath || `/login/student?course=${course.id}`)} className="enroll-btn" disabled={course.availability === "Unavailable"}>
            {course.availability === "Unavailable" ? "Unavailable" : "Enroll Now"}
          </button>

          <p className="access-info">
            Get access to this course after enrollment approval.
          </p>

        </aside>

      </section>

    </main>
  );
}

export default CourseDetail;