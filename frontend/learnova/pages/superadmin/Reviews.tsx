import type { LegacyValue } from "../../../lib/legacy-types";

import PublicIcon from "../../components/PublicIcon";
import SuperAdminRecords from "../../components/SuperAdminRecords";
import { reviews } from "../../data/reviews";
import useCourses from "../../utils/useCourses";

const columns = [["name", "Student"], ["course", "Course"], ["rating", "Rating"], ["text", "Review"], ["date", "Date"], ["status", "Status"]];
export default function Reviews() {
  const courses = useCourses();
  const rows = reviews.map((review: LegacyValue) => {
    const course = courses.find((item: LegacyValue) => String(item.id) === String(review.courseId));
    return { ...review, course: course?.title || "Course unavailable", rating: "5 / 5", date: "Not recorded", status: course?.status === "Published" ? "Published" : "Hidden" };
  });
  return <section className="admin-review-design"><header className="arv-banner"><div><h1>Reviews &amp; Ratings</h1><p>Monitor student feedback and review the learning experience across your courses.</p></div><blockquote>&ldquo;Happy learners build<br/>brighter tomorrows.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="cap"/></header><div className="arv-stats">{[["Average Rating", rows.length ? "5.0" : "0", "star"], ["Total Reviews", rows.length, "users"], ["Published Reviews", rows.filter((row: LegacyValue) => row.status === "Published").length, "check"], ["Hidden Reviews", rows.filter((row: LegacyValue) => row.status === "Hidden").length, "target"]].map(([label,value,icon]: LegacyValue,index: LegacyValue) => <article className={`arv-tone-${index}`} key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div><div className="arv-overview"><section className="arv-panel"><h2>Rating Breakdown</h2><p>Based on the existing homepage review ratings.</p>{[5,4,3,2,1].map((rating: LegacyValue) => <div className="arv-rating" key={rating}><span>{rating} <PublicIcon name="star"/></span><progress value={rating === 5 ? rows.length : 0} max={Math.max(1,rows.length)}/><strong>{rating === 5 ? rows.length : 0}</strong></div>)}</section><section className="arv-panel"><h2>Student Feedback</h2>{rows.slice(0,3).map((row: LegacyValue,index: LegacyValue) => <article className="arv-feedback" key={index}><span className="arv-avatar">{row.name.split(" ").map((part: LegacyValue) => part[0]).slice(0,2).join("")}</span><div><strong>{row.name}</strong><span className="arv-stars" aria-label="5 out of 5 stars">{[1,2,3,4,5].map((star: LegacyValue) => <PublicIcon key={star} name="star"/>)}</span><small>{row.course}</small><p>{row.text}</p></div></article>)}</section></div><SuperAdminRecords title="Reviews & Ratings" subtitle="Review existing student feedback displayed on the public homepage." rows={rows} columns={columns} /></section>;
}
