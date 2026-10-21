import type { LegacyValue } from "../../../lib/legacy-types";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import useCourses from "../../utils/useCourses";
import useBatches from "../../utils/useBatches";
import { paymentRecords, studentId } from "../../utils/batchStorage";


const isAvailable = (course: LegacyValue) => course.status === "Published" && course.availability === "Available";

function enrollmentState(course: LegacyValue, state: LegacyValue) {
  const enrollment = state.enrollments.find((item: LegacyValue) => item.studentId === studentId && String(item.courseId) === String(course.id));
  const payment = paymentRecords(state).find((item: LegacyValue) => item.studentId === studentId && String(item.courseId) === String(course.id) && ["Pending", "Approved"].includes(item.status));
  if (enrollment?.status === "Completed") return "completed";
  if (enrollment?.approved === true && enrollment?.status === "Active") return "active";
  if (enrollment?.status === "Pending" || payment) return "pending";
  return "available";
}

function BrowseCourses() {
  const catalog = useCourses();
  const state = useBatches();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const courses = catalog.filter(isAvailable);
  const categories = [...new Set(courses.map((course: LegacyValue) => course.category).filter(Boolean))].sort();
  const instructors = [...new Set(courses.map((course: LegacyValue) => course.instructor).filter(Boolean))].sort();
  const filtered = courses.filter((course: LegacyValue) => {
    const query = search.trim().toLowerCase();
    return (!query || course.title.toLowerCase().includes(query)) &&
      (!category || course.category === category) &&
      (!instructor || course.instructor === instructor) &&
      (!price || (price === "free" ? course.price === 0 : price === "under100" ? course.price > 0 && course.price < 100 : course.price >= 100)) &&
      (!rating || Number(course.rating) >= Number(rating));
  });

  function reset() {
    setSearch("");
    setCategory("");
    setInstructor("");
    setPrice("");
    setRating("");
  }

  return (
    <section className="student-browse-courses">
      <header className="student-browse-header">
        <div>
          <h1>Browse Courses</h1>
          <p>Discover published courses available for enrollment.</p>
        </div>
        <strong>{filtered.length} {filtered.length === 1 ? "Course" : "Courses"}</strong>
      </header>

      <div className="student-browse-filters" role="search" aria-label="Filter available courses">
        <label>Search by title<input type="search" placeholder="Search courses..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)} /></label>
        <label>Category<select value={category} onChange={(event: LegacyValue) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item: LegacyValue) => <option key={item}>{item}</option>)}</select></label>
        <label>Instructor<select value={instructor} onChange={(event: LegacyValue) => setInstructor(event.target.value)}><option value="">All instructors</option>{instructors.map((item: LegacyValue) => <option key={item}>{item}</option>)}</select></label>
        <label>Price<select value={price} onChange={(event: LegacyValue) => setPrice(event.target.value)}><option value="">Any price</option><option value="free">Free</option><option value="under100">Under PKR 100</option><option value="100plus">PKR 100 and above</option></select></label>
        <label>Rating<select value={rating} onChange={(event: LegacyValue) => setRating(event.target.value)}><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option><option value="4.8">4.8 and above</option></select></label>
      </div>

      {(search || category || instructor || price || rating) && <button className="student-browse-clear" type="button" onClick={reset}>Clear filters</button>}

      <div className="student-browse-grid">
        {filtered.map((course: LegacyValue) => {
          const status = enrollmentState(course, state);
          const action = {
            available: <Link className="student-browse-action" to={`/course/${course.id}`} state={{ enrollmentPath: `/student/payments?course=${course.id}` }}>Enroll Now</Link>,
            pending: <button className="student-browse-action" type="button" disabled>Pending Approval</button>,
            active: <Link className="student-browse-action" to="/student/courses">Go to Course</Link>,
            completed: <Link className="student-browse-action" to="/student/courses">Completed / View Course</Link>,
          }[status];
          return <article className="student-browse-card" key={course.id}>
            <img src={course.image || "/Logo.png"} alt={course.title} />
            <div className="student-browse-card-content">
              <span className="student-browse-category">{course.category}</span>
              <h2>{course.title}</h2>
              <p>Instructor: {course.instructor}</p>
              <div className="student-browse-meta"><span>{course.duration || "Duration unavailable"}</span><span>PKR {course.price}</span></div>
              <div className="student-browse-meta"><span>⭐ {course.rating > 0 ? course.rating : "Not rated"}{course.reviewCount != null ? ` (${course.reviewCount} reviews)` : ""}</span><span>Available</span></div>
              {action}
            </div>
          </article>;
        })}
      </div>
      {!filtered.length && <div className="student-browse-empty"><h2>No available courses found</h2><p>Try another search or clear your filters.</p></div>}
    </section>
  );
}

export default BrowseCourses;
