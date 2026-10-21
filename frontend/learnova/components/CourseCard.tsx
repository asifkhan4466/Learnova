import type { LegacyValue } from "../../lib/legacy-types";

import { useState } from "react";
import { Link } from "@/lib/navigation";
import useCourses from "../utils/useCourses";
import { getPublishedCourse } from "../utils/courseStorage";
import PublicIcon from "./PublicIcon";

function CourseCard({ course: suppliedCourse, variant = "default" }: LegacyValue) {
  useCourses();
  const [failedImage, setFailedImage] = useState<LegacyValue>(null);
  const course: LegacyValue = getPublishedCourse(suppliedCourse?.id);
  if (!course) return null;
  const unavailable = course.availability === "Unavailable";
  const image = course.image || "/Logo.png";
  const fallback = image === "/Logo.png" || failedImage === image;
  const reviewCount = course.reviewCount ?? course.reviewsCount;
  const lessons = course.lessons ?? course.lessonsCount ?? (course.curriculum?.length ? course.curriculum.reduce((sum: LegacyValue, item: LegacyValue) => sum + (Number(item.lectures) || 0), 0) : null);
  const destination = course.id === 1 ? "/course/1" : "/courses";
  const marketplace = variant === "marketplace";
  const link = marketplace ? `/login?redirect=${encodeURIComponent(destination)}&course=${course.id}` : "/courses";
  return (
    <article className={`course-card${marketplace ? " marketplace-course" : ""}`}>
      <div className="course-image">
        <img className={fallback ? "course-image-fallback" : ""} src={fallback ? "/Logo.png" : image} alt={course.title} loading="lazy" onError={() => setFailedImage(image)} />
        {(unavailable || course.label) && <span className="course-card-badge">{unavailable ? "Unavailable" : course.label}</span>}
      </div>
      <div className="course-content">
        <span className="course-category">{course.category}</span>
        <h3>{course.title}</h3>
        <p className="course-teacher">By {course.instructor}</p>
        <div className="course-rating">
          <strong><PublicIcon name="star" /> {course.rating > 0 ? course.rating : "Not rated"}</strong>
          <span>{reviewCount == null ? "Reviews unavailable" : `(${Number(reviewCount).toLocaleString("en-US")} reviews)`}</span>
        </div>
        <div className="course-info">
          {course.duration && <span><PublicIcon name="clock" />{course.duration}</span>}
          {lessons != null && <span><PublicIcon name="book" />{lessons} lessons</span>}
          {course.level && <span>{course.level}</span>}
        </div>
        <div className="course-card-bottom">
          <div className="course-price"><strong className="discount-price">PKR {course.price}</strong>{course.oldPrice > course.price && <del className="original-price">PKR {course.oldPrice}</del>}</div>
          {unavailable ? <button className="course-btn" disabled>Unavailable</button> : <Link to={link} state={marketplace ? { from: destination, selectedCourse: { id: course.id, name: course.title } } : undefined} className="course-btn" aria-label={`View ${course.title} course`}>View Course <PublicIcon name="arrow" /></Link>}
        </div>
      </div>
    </article>
  );
}
export default CourseCard;
