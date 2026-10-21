import { courses as defaults } from "../data/courses";

export const COURSE_STORAGE_KEY = "learnova_courses";
export const COURSE_STATUSES = ["Draft", "Published", "Unpublished", "Archived"];
const listeners = new Set();
let cachedText;
let cachedCourses = defaults;

function validCourses(value) {
  return Array.isArray(value) && new Set(value.map(course => String(course?.id))).size === value.length &&
    value.every(course => course && (typeof course.id === "string" || typeof course.id === "number") &&
      typeof course.title === "string" && typeof course.instructor === "string" &&
      typeof course.category === "string" && Number.isFinite(course.price) && course.price >= 0 &&
      COURSE_STATUSES.includes(course.status));
}

export function getCourses() {
  try {
    let text = localStorage.getItem(COURSE_STORAGE_KEY);
    if (text === null) {
      text = JSON.stringify(defaults);
      localStorage.setItem(COURSE_STORAGE_KEY, text);
    }
    if (text !== cachedText) {
      const parsed = JSON.parse(text);
      cachedCourses = validCourses(parsed) ? parsed.map(course => ({ availability: "Available", ...course })) : defaults.map(course => ({ availability: "Available", ...course }));
      cachedText = text;
    }
    return cachedCourses;
  } catch {
    return defaults;
  }
}

export function saveCourses(courses) {
  if (!validCourses(courses)) throw new Error("Check course fields, status, prices, and unique IDs before saving.");
  const text = JSON.stringify(courses);
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, text);
  } catch {
    throw new Error("Courses could not be saved in this browser. Check available storage and try again.");
  }
  cachedText = text;
  cachedCourses = JSON.parse(text);
  listeners.forEach(listener => listener());
  return cachedCourses;
}

export function addCourse(course) {
  const courses = getCourses();
  const slug = course.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
  let id = slug;
  let suffix = 2;
  while (courses.some(existing => String(existing.id) === id)) id = `${slug}-${suffix++}`;
  const created = {
    oldPrice: 0, rating: 0, students: 0, level: "Beginner", image: "/Logo.png", availability: "Available",
    description: "", duration: "", status: "Draft", featured: false, trending: false,
    popular: false, isNew: false, skills: "", visual: "code", label: "Course", art: "",
    outcomes: [], curriculum: [], requirements: "", certificate: false,
    ...course, id,
  };
  saveCourses([...courses, created]);
  return created;
}

export function updateCourse(id, updates) {
  const courses = getCourses();
  const existing = courses.find(course => String(course.id) === String(id));
  if (!existing) throw new Error("This course could not be found. Refresh and try again.");
  const updated = { ...existing, ...updates, id: existing.id };
  saveCourses(courses.map(course => course === existing ? updated : course));
  return updated;
}

export function subscribeCourses(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (event.key === COURSE_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function getPublishedCourses() {
  return getCourses().filter(course => course.status === "Published");
}

export function getPublishedCourse(id) {
  return getPublishedCourses().find(course => String(course.id) === String(id));
}

export function getDiscoveryCourses(group) {
  const flag = { featured: "featured", trending: "trending", popular: "popular", new: "isNew" }[group];
  if (!flag) return [];
  const selected = getPublishedCourses().filter(course => course[flag] === true);
  const order = { trending: "trendingOrder", new: "newOrder" }[group];
  return order ? selected.sort((a, b) => (a[order] ?? Infinity) - (b[order] ?? Infinity)) : selected;
}
