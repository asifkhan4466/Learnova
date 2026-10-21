import type { LegacyValue } from "../../../lib/legacy-types";

import { useState } from "react";
import useCourses from "../../utils/useCourses";
import CourseCard from "../../components/CourseCard";

function Courses() {
  const courses = useCourses().filter((course: LegacyValue) => course.status === "Published");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const categories = [...new Set(courses.map((course: LegacyValue) => course.category).filter(Boolean))].sort();
  const levels = [...new Set(courses.map((course: LegacyValue) => course.level).filter(Boolean))].sort();
  const filtered = courses.filter((course: LegacyValue) => {
    const matchesSearch = [course.title, course.category, course.instructor].join(" ").toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (!category || course.category === category) && (!level || course.level === level) &&
      (!price || (price === "free" ? course.price === 0 : price === "under100" ? course.price > 0 && course.price < 100 : course.price >= 100)) &&
      (!rating || Number(course.rating) >= Number(rating));
  });
  function reset() { setSearch(""); setCategory(""); setLevel(""); setPrice(""); setRating(""); }
  return (
    <main className="courses-page">
      <section className="courses-header">
        <span>Learnova Courses</span><h1>Explore Our Courses</h1>
        <p>Discover courses designed to help you build practical skills and achieve your learning goals.</p>
      </section>
      <section className="all-courses">
        <div className="catalog-tools" role="search" aria-label="Filter courses">
          <label className="catalog-search">Search<input type="search" placeholder="Search courses..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)} /></label>
          <label>Category<select value={category} onChange={(event: LegacyValue) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item: LegacyValue) => <option key={item}>{item}</option>)}</select></label>
          <label>Level<select value={level} onChange={(event: LegacyValue) => setLevel(event.target.value)}><option value="">All levels</option>{levels.map((item: LegacyValue) => <option key={item}>{item}</option>)}</select></label>
          <label>Price<select value={price} onChange={(event: LegacyValue) => setPrice(event.target.value)}><option value="">Any price</option><option value="free">Free</option><option value="under100">Under PKR 100</option><option value="100plus">PKR 100 and above</option></select></label>
          <label>Rating<select value={rating} onChange={(event: LegacyValue) => setRating(event.target.value)}><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option><option value="4.8">4.8 and above</option></select></label>
        </div>
        <div className="catalog-results"><p role="status">{filtered.length} {filtered.length === 1 ? "course" : "courses"}</p>{(search || category || level || price || rating) && <button type="button" onClick={reset}>Clear filters</button>}</div>
        <div className="courses-grid">{filtered.map((course: LegacyValue) => <CourseCard key={course.id} course={course} />)}</div>
        {!filtered.length && <div className="catalog-empty"><h2>No courses found</h2><p>Try another search or clear your filters.</p><button type="button" onClick={reset}>Clear filters</button></div>}
      </section>
    </main>
  );
}
export default Courses;
