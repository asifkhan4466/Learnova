import type { LegacyValue } from "../../../lib/legacy-types";
import { usePublicSections } from "../../utils/publicSections";
import { reviews } from "../../data/reviews";
import useCourses from "../../utils/useCourses";

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "@/lib/navigation";
import CourseCard from "../../components/CourseCard";
import InstructorCard from "../../components/InstructorCard";
import { instructors } from "../../data/instructors";
import PublicIcon from "../../components/PublicIcon";
import { getPublishedCourses, getPublishedCourse, getDiscoveryCourses } from "../../utils/courseStorage";
import { discoveryLink } from "./homepageCourses";

const goals = [
  { icon: "briefcase", title: "Start a new career", text: "Find a fresh direction with skills that open doors.", query: "career", action: "Find your path" },
  { icon: "code", title: "Build job-ready skills", text: "Turn what you learn into work you’re proud of.", query: "Development", action: "Explore skills" },
  { icon: "cap", title: "Learn for university", text: "Go beyond the classroom. Get a head start.", query: "university", action: "Start exploring" },
  { icon: "target", title: "Grow professionally", text: "Stay curious, keep up, and take your next step.", query: "professional", action: "Keep growing" },
];
const categories = [
  { icon: "code", name: "Development", count: "24" }, { icon: "design", name: "Design", count: "18" },
  { icon: "chart", name: "Data & Analytics", count: "16" }, { icon: "phone", name: "Mobile Development", count: "12" },
  { icon: "spark", name: "Artificial Intelligence", count: "10" }, { icon: "database", name: "Database", count: "8" },
];
const paths = [
  { name: "Frontend Developer", icon: "code", courses: 6, tags: ["HTML & CSS", "JavaScript", "React"], query: "frontend", note: "Build the web people love to use." },
  { name: "Full Stack Developer", icon: "database", courses: 8, tags: ["JavaScript", "APIs", "Databases"], query: "full stack", note: "Bring complete digital products to life." },
  { name: "UI/UX Designer", icon: "design", courses: 5, tags: ["Figma", "Research", "Prototyping"], query: "Design", note: "Make every interaction more meaningful." },
  { name: "Data Analyst", icon: "chart", courses: 5, tags: ["Excel", "SQL", "Visualization"], query: "data analyst", note: "Turn information into better decisions." },
  { name: "Python Developer", icon: "code", courses: 4, tags: ["Python", "Logic", "Automation"], query: "Python", note: "Solve everyday problems with code." },
];

const benefits = [
  ["book", "Quality courses", "A clear path from the basics to skills you can put to work."],
  ["users", "Expert teachers", "Real experience, thoughtful guidance, and practical insights."],
  ["video", "Live classes", "Ask questions, explore ideas, and learn together in real time."],
  ["globe", "Learn anywhere", "Keep learning wherever you are, at a pace that works for you."],
  ["award", "Earn certificates", "Celebrate your progress and showcase what you’ve learned."],
  ["chart", "Track your progress", "See how far you’ve come and know what’s next."],
];


function SectionHeading({ label, title, text, link, linkText = "Explore all courses" }: LegacyValue) {
  return <div className="home-section-heading"><div><span className="home-eyebrow">{label}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{link && <Link className="home-text-link" to={link}>{linkText} <PublicIcon name="arrow" /></Link>}</div>;
}

function Home() {
 const content=usePublicSections();
  useCourses();
  const [tab, setTab] = useState("Most Popular");
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [instructor, setInstructor] = useState<LegacyValue>(null);
  const profileDialog = useRef<LegacyValue>(null);
  const publishedCourses = getPublishedCourses();
  const previewCourse = getPublishedCourse(1);
  const featured = query ? publishedCourses.filter((course: LegacyValue) => (course.title + " " + course.category + " " + course.instructor + " " + course.skills).toLowerCase().includes(query.toLowerCase())) : getDiscoveryCourses("featured");
  const trending = getDiscoveryCourses(tab === "New" ? "new" : tab === "Trending" ? "trending" : "popular");

  useEffect(() => { if (query) document.getElementById("featured-courses")?.scrollIntoView({ behavior: "instant", block: "start" }); }, [query]);
  useEffect(() => { if (instructor && !profileDialog.current.open) profileDialog.current.showModal(); }, [instructor]);

  return (
    <main className="home marketplace-home">
      {!content["0"].deleted && (<section className="home-hero" aria-labelledby="hero-title">
        <div className="home-container home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-hero-label"><span /> LEARN · GROW · ACHIEVE</span>
            <h1 id="hero-title">{content["0"].title}</h1>
            <p>{content["0"].text}</p>
            <div className="home-buttons"><Link className="home-button" to="/courses">Explore courses <PublicIcon name="arrow" /></Link><Link className="home-button home-button-outline" to="/register">Get started for free</Link></div>
            <div className="home-hero-proof"><div className="home-avatar-stack" aria-hidden="true"><span>AK</span><span>SA</span><span>MA</span><span>+</span></div><div><strong>Join 1,000+ curious learners</strong><span><PublicIcon name="star" /> 4.8 learner rating <i>·</i> A world of possibilities</span></div></div>
          </div>
          <div className="home-hero-visual" role="img" aria-label="A preview of Learnova: a web development course, learning progress, expert guidance, and a completion certificate">
            <div className="home-visual-orbit" />
            <div className="home-preview">
              <div className="home-preview-top"><span><i /><i /><i /></span><small>YOUR LEARNING SPACE</small><PublicIcon name="book" /></div>
              <div className="home-preview-body">
                <div className="home-preview-greeting"><div><small>A LITTLE PROGRESS, EVERY DAY</small><strong>Keep your curiosity going.</strong></div><span className="home-preview-avatar">A</span></div>
                {previewCourse && <div className="home-preview-course"><div className="home-preview-code"><span>&lt;build_your_future&gt;</span><strong>Ideas become<br />something real.</strong><div><span>HTML</span><span>CSS</span><span>JS</span></div><PublicIcon name="code" /><span className="home-preview-play"><PublicIcon name="play" /></span></div><div className="home-preview-course-info"><small>{previewCourse.category.toUpperCase()}</small><strong>{previewCourse.title}</strong><span>With {previewCourse.instructor} <i>·</i> {previewCourse.duration.toLowerCase().replace(" weeks", "-week")} course</span><div className="home-preview-progress-label"><span>Your learning journey</span><b>72%</b></div><div className="home-preview-progress"><span /></div></div></div>}
                <div className="home-preview-next"><span><PublicIcon name="video" /></span><div><strong>Learn together. Go further.</strong><small>Live classes with expert instructors</small></div><PublicIcon name="arrow" /></div>
              </div>
            </div>
            <div className="home-floating-certificate"><span><PublicIcon name="award" /></span><div><strong>Make your progress count.</strong><small>Skills learned. Certificate earned.</small></div><PublicIcon name="check" /></div>
            <div className="home-floating-mentor"><div className="home-mentor-avatar">JS</div><div><strong>John Smith</strong><small>Your guide to web development</small><span><PublicIcon name="star" /> 4.9 <i>·</i> Expert instructor</span></div></div>
            <span className="home-visual-caption">A glimpse of what’s ahead.</span>
          </div>
        </div>
        <div className="home-hero-strip home-container">{[["users", "Expert-led courses"], ["code", "Practical learning"], ["video", "Live classes"], ["award", "Shareable certificates"]].map(([icon, text]: LegacyValue) => <span key={text}><PublicIcon name={icon} />{text}</span>)}</div>
      </section>)}

      {!content["1"].deleted && (<section className="home-section home-container home-goals" aria-labelledby="goals-title">
        <div className="home-section-heading"><div><span className="home-eyebrow">YOUR AMBITION. YOUR STARTING POINT.</span><h2 id="goals-title">{content["1"].title}</h2></div><p className="home-heading-aside">Big goals start with one small step.</p></div>
        <div className="home-goal-grid">{goals.map((goal: LegacyValue) => <Link className="home-goal-card" key={goal.title} to={discoveryLink(goal.query)}><span className="home-icon-box"><PublicIcon name={goal.icon} /></span><h3>{goal.title}</h3><p>{content["1"].text}</p><span className="home-goal-action">{goal.action}<PublicIcon name="arrow" /></span></Link>)}</div>
      </section>)}

      {!content["2"].deleted && (<section id="featured-courses" className="home-section home-container home-featured">
        <SectionHeading label="HANDPICKED FOR YOUR NEXT STEP" title={query ? 'Results for “' + query + '”' : "A great place to start"} text={query ? featured.length + " courses matching your search" : "Our featured courses. Practical skills, taught by people who know their craft."} link={query ? "/" : "/courses"} linkText={query ? "Clear search" : "Explore all courses"} />
        {featured.length ? <div className="home-course-grid" aria-live="polite">{featured.map((course: LegacyValue) => <CourseCard key={course.id} course={course} variant="marketplace" />)}</div> : <div className="home-search-empty" role="status"><PublicIcon name="search" /><h3>No courses found just yet</h3><p>{content["2"].text}</p><Link to="/" className="home-button home-button-outline">Browse featured courses</Link></div>}
      </section>)}

      {!content["3"].deleted && (<section className="home-trending home-section">
        <div className="home-container"><SectionHeading label="FOLLOW YOUR CURIOSITY" title={content["3"].title} text={content["3"].text} />
          <div className="home-course-tabs" role="tablist" aria-label="Discover courses">{["Most Popular", "New", "Trending"].map((item: LegacyValue) => <button type="button" role="tab" key={item} id={"tab-" + item.replaceAll(" ", "-")} aria-selected={tab === item} aria-controls="trending-panel" tabIndex={tab === item ? 0 : -1} onClick={() => setTab(item)} onKeyDown={(event: LegacyValue) => { const labels = ["Most Popular", "New", "Trending"]; let next; if (event.key === "ArrowRight") next = (labels.indexOf(item) + 1) % 3; if (event.key === "ArrowLeft") next = (labels.indexOf(item) + 2) % 3; if (event.key === "Home") next = 0; if (event.key === "End") next = 2; if (next !== undefined) { event.preventDefault(); setTab(labels[next]); document.getElementById("tab-" + labels[next].replaceAll(" ", "-"))?.focus(); } }}>{item}</button>)}</div>
          <div className="home-course-grid" id="trending-panel" role="tabpanel" aria-labelledby={"tab-" + tab.replaceAll(" ", "-")}>{trending.map((course: LegacyValue) => <CourseCard key={course.id} course={course} variant="marketplace" />)}</div>
        </div>
      </section>)}

      {!content["4"].deleted && (<section className="home-section home-container">
        <SectionHeading label="THERE’S SOMETHING FOR EVERY CURIOSITY" title={content["4"].title} link="/categories" linkText="All categories" />
        <div className="home-category-grid">{categories.map((category: LegacyValue) => <Link className="home-category" to={discoveryLink(category.name)} key={category.name}><span className="home-icon-box"><PublicIcon name={category.icon} /></span><h3>{category.name}</h3><span className="home-category-count">{category.count} courses</span><span className="home-category-link">Explore courses <PublicIcon name="arrow" /></span></Link>)}</div>
      </section>)}

      {!content["5"].deleted && (<section className="home-paths home-section">
        <div className="home-container"><SectionHeading label="DON’T JUST TAKE A COURSE. TAKE A DIRECTION." title={content["5"].title} text={content["5"].text} />
          <div className="home-path-grid">{paths.map((path: LegacyValue, index: LegacyValue) => <Link key={path.name} to={discoveryLink(path.query)} className="home-path-card"><div className="home-path-top"><PublicIcon name={path.icon} /><span>PATH 0{index + 1}</span></div><h3>{path.name}</h3><p>{path.note}</p><div className="home-path-tags">{path.tags.map((tag: LegacyValue) => <span key={tag}>{tag}</span>)}</div><div className="home-path-bottom"><span>{path.courses} courses</span><span>Explore path <PublicIcon name="arrow" /></span></div></Link>)}</div>
        </div>
      </section>)}

      {!content["6"].deleted && (<section className="home-section home-container">
        <SectionHeading label="REAL EXPERIENCE. REAL CONNECTION." title={content["6"].title} text={content["6"].text} link="/contact" linkText="Become an instructor" />
        <div className="home-instructor-grid">{instructors.map((person: LegacyValue) => <InstructorCard key={person.name} instructor={person} onViewProfile={setInstructor} />)}</div>
      </section>)}

      {!content["7"].deleted && (<section className="home-why home-section">
        <div className="home-container home-why-layout"><div className="home-why-intro"><span className="home-eyebrow">THE LEARNOVA DIFFERENCE</span><h2>{content["7"].title}</h2><p>{content["7"].text}</p><Link to="/about" className="home-text-link">Get to know Learnova <PublicIcon name="arrow" /></Link></div><div className="home-benefit-grid">{benefits.map(([icon, title, text]: LegacyValue) => <div className="home-benefit" key={title}><PublicIcon name={icon} /><h3>{title}</h3><p>{text}</p></div>)}</div></div>
      </section>)}

      {!content["8"].deleted && (<section className="home-trust">
        <div className="home-container"><div className="home-trust-heading"><span className="home-eyebrow">GROWING, TOGETHER</span><h2>{content["8"].title}</h2><p>{content["8"].text}</p></div><div className="home-stats">{[["100+", "Practical courses"], ["50+", "Expert teachers"], ["1K+", "Curious learners"], ["95%", "Student satisfaction"]].map(([number, label]: LegacyValue) => <div key={label}><strong>{number}</strong><span>{label}</span></div>)}</div></div>
      </section>)}

      {!content["9"].deleted && (<section className="home-section home-container">
        <SectionHeading label="REAL LEARNERS. NEW POSSIBILITIES." title={content["9"].title} text={content["9"].text} />
        <div className="home-review-grid">{reviews.filter((review: LegacyValue) => getPublishedCourse(review.courseId)).map((review: LegacyValue) => <figure className="home-review" key={review.name}><div className="home-review-stars" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_: LegacyValue, index: LegacyValue) => <PublicIcon key={index} name="star" />)}</div><blockquote>“{review.text}”</blockquote><figcaption><span className="home-review-avatar">{review.initial}</span><div><strong>{review.name}</strong><span>{getPublishedCourse(review.courseId)!.title}</span></div><PublicIcon name="check" /></figcaption></figure>)}</div>
      </section>)}

      {!content["10"].deleted && (<section className="home-final-cta home-container">
        <div><span className="home-eyebrow">YOUR FUTURE IS A WORK IN PROGRESS.</span><h2>{content["10"].title}</h2><p>{content["10"].text}</p><div className="home-buttons"><Link to="/register" className="home-button home-button-white">Create your account <PublicIcon name="arrow" /></Link><Link to="/courses" className="home-button home-button-glass">Explore courses</Link></div></div><div className="home-cta-art" aria-hidden="true"><span>LEARN</span><span>GROW <PublicIcon name="arrow" /></span><span>ACHIEVE.</span><div className="home-cta-art-line" /></div>
      </section>)}

      <dialog className="home-profile-dialog" ref={profileDialog} aria-labelledby="instructor-dialog-title" onClose={() => setInstructor(null)}>
        {instructor && <><button type="button" className="home-dialog-close" aria-label="Close instructor profile" onClick={() => profileDialog.current.close()}><PublicIcon name="close" /></button><span className="home-dialog-avatar">{instructor.initials}</span><span className="home-eyebrow">MEET YOUR INSTRUCTOR</span><h2 id="instructor-dialog-title">{instructor.name}</h2><strong>{instructor.skill}</strong><p>{instructor.bio}</p><div className="home-dialog-facts"><span>{instructor.experience}</span><span>{instructor.rating} instructor rating</span><span>{instructor.count} courses</span></div><Link to={discoveryLink(instructor.name)} className="home-button" onClick={() => profileDialog.current.close()}>Explore their courses <PublicIcon name="arrow" /></Link></>}
      </dialog>
    </main>
  );
}
export default Home;
