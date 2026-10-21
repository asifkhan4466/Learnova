import type { LegacyValue } from "../../../lib/legacy-types";
import useCategories from "../../utils/useCategories";
import { AdminHeading } from "../../components/AdminSummary";
import PublicIcon from "../../components/PublicIcon";


import { useRef, useState } from "react";
import useCourses from "../../utils/useCourses";
import { addCourse, updateCourse, COURSE_STATUSES } from "../../utils/courseStorage";

import { usePeople } from "../../utils/peopleStorage";

function Courses({ adminForm = false }: LegacyValue) {
 const teachers = usePeople();
  const courses = useCourses();
  const dialog = useRef<LegacyValue>(null);
  const imageRequest = useRef(0);
  const imageInput = useRef<LegacyValue>(null);
  const [uploading, setUploading] = useState(false);
  const categories = useCategories();
  const [editing, setEditing] = useState<LegacyValue>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState<Record<string, LegacyValue>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const visibleCourses = courses.filter((course: LegacyValue) => (!category || course.category === category) && (!status || course.status === status) && (course.title + " " + course.instructor).toLowerCase().includes(search.toLowerCase()));
  function openCourse(course: LegacyValue, view: LegacyValue = false) {
    imageRequest.current += 1;
    setUploading(false);
    setEditing(course?.id ?? null);
    setReadOnly(view);
    setForm(course ? { title: course.title, category: course.category, instructor: course.instructor, instructorId: course.instructorId || teachers.find((teacher: LegacyValue) => teacher.name === course.instructor)?.id || "", price: course.price, duration: course.duration || "", image: course.image || "", description: course.description || "", status: course.status, ...(adminForm ? { availability: course.availability ?? "Available" } : {}) } : { title: "", category: "", instructor: "", price: "", duration: "", image: "", description: "", status: "Draft", ...(adminForm ? { availability: "Available" } : {}) });
    setError("");
    dialog.current.showModal();
  }
  function save(event: LegacyValue) {
    event.preventDefault();
    if (uploading) return;
    {
      const missing = ["title", "category", "instructor", "price", "duration"].filter((key: LegacyValue) => !String(form[key] ?? "").trim());
      if (missing.length) { setError(`Required: ${missing.join(", ")}.`); return; }
      if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) { setError("Price must be a number of zero or more."); return; }
    }
    const updates: LegacyValue = { ...form, title: form.title.trim(), category: form.category.trim(), instructor: form.instructor.trim(), price: Number(form.price), image: form.image.trim() };
    if (!updates.title || !updates.category || !updates.instructor) { setError("Enter a title, category, and instructor."); return; }
    {
      updates.duration = form.duration.trim();
      updates.instructorId = teachers.find((teacher: LegacyValue) => teacher.name === form.instructor)?.id || form.instructorId || "";
    }
    if (updates.image && !(/^data:image\/(png|jpeg|webp);base64,/.test(updates.image)) && !/^(https?:\/\/|\/(?!\/))/.test(updates.image)) { setError("Choose a valid course image file."); return; }
    try {
      if (editing === null) addCourse(updates); else updateCourse(editing, updates);
      setNotice(editing === null ? "Course added." : "Course updated.");
      dialog.current.close();
    } catch (failure: LegacyValue) { setError(failure.message); }
  }
  function change(event: LegacyValue) {
    const { name, value } = event.target;
    setForm((previous: LegacyValue) => ({ ...previous, [name]: value, ...(name === "instructor" ? { instructorId: teachers.find((teacher: LegacyValue) => teacher.name === value)?.id || "" } : {}) }));
  }
  async function uploadImage(event: LegacyValue) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const request = ++imageRequest.current;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
      setUploading(false); setError("Choose a PNG, JPEG or WebP image up to 1 MB."); return;
    }
    setUploading(true); setError("");
    try {
      const image = await createImageBitmap(file);
      image.close();
      const dataUrl = await new Promise((resolve: LegacyValue, reject: LegacyValue) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The image could not be read."));
        reader.readAsDataURL(file);
      });
      if (request === imageRequest.current) setForm((previous: LegacyValue) => ({ ...previous, image: dataUrl }));
    } catch { if (request === imageRequest.current) setError("Choose a readable image file."); }
    finally { if (request === imageRequest.current) setUploading(false); }
  }



  return (
    <div className={`subadmin-courses-page${adminForm ? "" : " sa-course-market"}`}>

      {!adminForm ? <AdminHeading title="Courses" subtitle="Create and manage courses, content, and enrollments." icon="book"><button className="subadmin-add-course-btn" onClick={()=>openCourse(null)}>+ Add Course</button></AdminHeading> : (<div className="subadmin-courses-header">
        <div>
          <h1>Courses</h1>
          <p>Manage courses, teachers, batches and enrollments.</p>
        </div>

        <button className="subadmin-add-course-btn" onClick={() => openCourse(null)}>
          + Add Course
        </button>
      </div>)}

      {!adminForm && <div className="sac-stats">{[["Total Courses",courses.length,"book"],["Published Courses",courses.filter((course: LegacyValue) => course.status === "Published").length,"play"],["Draft Courses",courses.filter((course: LegacyValue) => course.status === "Draft").length,"clock"],["Total Enrollments",courses.reduce((sum: LegacyValue,course: LegacyValue) => sum + (Number(course.students) || 0),0),"users"]].map(([label,value,icon]: LegacyValue,index: LegacyValue) => <article className={`sac-tone-${index}`} key={label}><span><PublicIcon name={icon}/></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</div>}
      <div className="subadmin-course-filters">

        <input
          type="text"
          placeholder="Search courses..." value={search} onChange={(event: LegacyValue) => setSearch(event.target.value)}
        />

        <select aria-label="Filter category" value={category} onChange={(event: LegacyValue) => setCategory(event.target.value)}>
          <option value="">All Categories</option>
          {categories.map((value: LegacyValue) => <option key={value}>{value}</option>)}
        </select>

        <select aria-label="Filter status" value={status} onChange={(event: LegacyValue) => setStatus(event.target.value)}>
          <option value="">All Status</option>
          {COURSE_STATUSES.map((value: LegacyValue) => <option key={value}>{value}</option>)}
        </select>

      </div>

      {notice && <p role="status">{notice}</p>}
      {adminForm ? <div className="admin-course-table-wrap" tabIndex={"0" as unknown as number} aria-label="Course records"><table className="admin-course-table"><thead><tr>{["Course", "Category", "Instructor", "Price", "Enrolled", "Status", "Availability", "Actions"].map((label: LegacyValue) => <th key={label}>{label}</th>)}</tr></thead><tbody>{visibleCourses.map((course: LegacyValue) => <tr key={course.id}><td><div className="admin-course-cell"><img src={course.image || "/Logo.png"} alt=""/><div><strong>{course.title}</strong><small>{course.duration}</small></div></div></td><td><span className="admin-course-category">{course.category}</span></td><td>{course.instructor}</td><td>PKR {Number(course.price).toFixed(2)}</td><td>{course.students ?? 0}</td><td><span className={course.status === "Published" ? "course-active" : "course-inactive"}>{course.status}</span></td><td><span className="course-inactive">{course.availability ?? "Available"}</span></td><td><div className="subadmin-course-actions"><button onClick={() => openCourse(course, true)}>View</button><button onClick={() => openCourse(course)}>Edit</button></div></td></tr>)}{!visibleCourses.length && <tr><td colSpan={"8" as unknown as number}>No matching courses.</td></tr>}</tbody></table><p role="status">Showing {visibleCourses.length} of {courses.length} courses</p></div> : (
      <div className="subadmin-course-list">
        {visibleCourses.map((course: LegacyValue) => <article className="subadmin-course-card" key={course.id}>
          <div className="subadmin-course-icon"><img src={course.image || "/Logo.png"} alt={course.title} onError={(e: LegacyValue)=>{e.currentTarget.onerror=null;e.currentTarget.src="/Logo.png";}}/>{course.label&&<span className="sac-image-badge">{course.label}</span>}</div>
          <div className="subadmin-course-info"><div className="subadmin-course-title"><h2>{course.title}</h2></div><p className="sac-description">{course.summary || course.description}</p><div className="sac-instructor"><span>{course.instructor?.charAt(0)}</span><div><strong>{course.instructor}</strong><small>{course.category}</small></div></div><div className="sac-course-meta"><span><PublicIcon name="clock"/>{course.duration}</span><span><PublicIcon name="users"/>{course.students || 0} enrolled</span><strong>PKR {Number(course.price).toLocaleString()}</strong></div></div>
          <div className="subadmin-course-actions"><span className={course.status === "Published" ? "course-active" : "course-inactive"}>{course.status}</span><button className="subadmin-view-course-btn" onClick={()=>openCourse(course,true)}>View</button><button className="subadmin-edit-course-btn" onClick={()=>openCourse(course)}>Edit</button></div>
        </article>)}
        {!visibleCourses.length && <p>No matching courses.</p>}
      </div>
      )}

      <dialog className="subadmin-course-dialog" ref={dialog} aria-labelledby="course-dialog-title">
        <form onSubmit={save} noValidate>
          <h2 id="course-dialog-title">{readOnly ? "View Course" : editing === null ? "Add Course" : "Edit Course"}</h2>
          {adminForm && readOnly && <span className="admin-course-availability">{form.availability || "Available"}</span>}
          <fieldset disabled={readOnly || uploading}>
            <div className="subadmin-course-form-grid">
              {[['title', 'Title'], ['category', 'Category'], ['instructor', 'Instructor'], ['price', 'Course Price'], ['duration', 'Duration'], ['image', 'Course Image']].map(([name, label]: LegacyValue) => <label key={name}>{label}
                {name === 'category' ? <select name={name} required value={form.category || ""} onChange={change}><option value="">Select category</option>{categories.map((value: LegacyValue) => <option key={value}>{value}</option>)}</select>
                  : name === 'instructor' ? <select name={name} required value={form.instructor || ""} onChange={change}><option value="">Select instructor</option>{form.instructor && !teachers.some((teacher: LegacyValue) => teacher.name === form.instructor) && <option value={form.instructor}>{form.instructor} (existing instructor)</option>}{teachers.map((teacher: LegacyValue) => <option key={teacher.id} value={teacher.name}>{teacher.name}</option>)}</select>
                  : name === 'image' ? <><input ref={imageInput} type="file" aria-label="Course Image" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} /><small>PNG, JPEG or WebP, up to 1 MB. Stored in this browser.</small></>
                  : <input name={name} type={name === 'price' ? 'number' : 'text'} min={name === 'price' ? '0' : undefined} step={name === 'price' ? '0.01' : undefined} required={['title', 'category', 'instructor', 'price'].includes(name) || (name === 'duration')} value={form[name] ?? ''} onChange={change} />}
              </label>)}
              <label>Status<select name="status" value={form.status || 'Draft'} onChange={change}>{COURSE_STATUSES.map((value: LegacyValue) => <option key={value}>{value}</option>)}</select></label>
              {adminForm && <label>Availability<select name="availability" value={form.availability || "Available"} onChange={change}><option>Available</option><option>Unavailable</option></select></label>}
              <label className="subadmin-course-description">Description<textarea name="description" rows={"4" as unknown as number} value={form.description || ''} onChange={change} /></label>
            </div>
          </fieldset>
          {form.image && <img className="subadmin-course-image-preview" src={form.image} alt="Course preview" />}
          {form.image && !readOnly && <div className="admin-course-image-actions"><button type="button" disabled={uploading} onClick={() => imageInput.current.click()}>Change Image</button><button type="button" onClick={() => { imageRequest.current += 1; setUploading(false); setForm((previous: LegacyValue) => ({ ...previous, image: "" })); setError(""); }}>Remove Image</button></div>}
          {error && <p role="alert">{error}</p>}
          <div className="subadmin-course-dialog-actions"><button type="button" onClick={() => dialog.current.close()}>{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button type="submit" disabled={uploading} className="subadmin-add-course-btn">{uploading ? "Preparing image..." : "Save Course"}</button>}</div>
        </form>
      </dialog>
    </div>
  );
}

export default Courses;