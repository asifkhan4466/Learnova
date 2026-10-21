import type { LegacyValue } from "../../../lib/legacy-types";
import { useRef, useState, type FormEvent } from "react";

const SUBMISSIONS_KEY = "learnova_student_assignment_submissions";

function Assignments() {
  const dialog = useRef<LegacyValue>(null);
  const submissionInFlight = useRef(false);
  const [selected,setSelected] = useState<LegacyValue>(null);
  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = JSON.parse((localStorage.getItem(SUBMISSIONS_KEY) as LegacyValue));
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  });
  const [message, setMessage] = useState("");
  const assignments = [
    {
      title: "Build a Responsive Website",
      course: "Web Development",
      batch: "Batch 01",
      dueDate: "September 10, 2026",
      status: "Pending",
    },
    {
      title: "Create UI Design",
      course: "UI/UX Design",
      batch: "Batch 02",
      dueDate: "September 12, 2026",
      status: "Pending",
    },
    {
      title: "JavaScript Functions Task",
      course: "Web Development",
      batch: "Batch 01",
      dueDate: "September 15, 2026",
      status: "Submitted",
    },
  ];
  const rows = assignments.map((assignment: LegacyValue) => submissions[assignment.title] ? { ...assignment, status: "Submitted" } : assignment);

  function openAssignment(assignment: LegacyValue) {
    setSelected(assignment);
    setMessage("");
    dialog.current.showModal();
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || submissionInFlight.current || submissions[selected.title]) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      setMessage("Please select a PDF, JPG, JPEG, PNG, or WEBP file.");
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Only PDF and image files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("File size must be 10 MB or smaller.");
      return;
    }
    submissionInFlight.current = true;
    try {
      const dataUrl = await new Promise((resolve: LegacyValue, reject: LegacyValue) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The selected file could not be read."));
        reader.readAsDataURL(file);
      });
      const submission = {
        assignment: selected.title,
        notes: String(form.get("notes") || "").trim(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: dataUrl,
        submittedAt: new Date().toISOString(),
      };
      const next = { ...submissions, [selected.title]: submission };
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next));
      setSubmissions(next);
      setMessage("Assignment submitted successfully.");
      formElement.reset();
    } catch (error: LegacyValue) {
      setMessage(error.message || "Assignment could not be submitted.");
    } finally {
      submissionInFlight.current = false;
    }
  }

  return (
    <div className="assignments-page">
      <dialog ref={dialog} aria-labelledby="student-assignment-title"><h2 id="student-assignment-title">{selected?.title}</h2>{selected && <dl>{[["Course",selected.course],["Batch",selected.batch],["Due Date",selected.dueDate],["Status",submissions[selected.title] ? "Submitted" : selected.status]].map(([label,value]: LegacyValue)=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}{selected && !submissions[selected.title] && <form className="assignment-submit-form" onSubmit={submitAssignment}><label>Upload Assignment (PDF or Image)<input name="file" type="file" accept=".pdf,image/jpeg,image/png,image/webp" required /></label><label>Submission Notes<textarea name="notes" rows={"4" as unknown as number} placeholder="Add any notes for your teacher..." /></label><button type="submit">Submit Assignment</button></form>}{submissions[selected?.title] && <p className="assignment-submitted-file">Submitted file: {submissions[selected.title].fileName}</p>}{message && <p role="status">{message}</p>}<form method="dialog"><button>Close</button></form></dialog>

      <div className="assignments-header">
        <div>
          <h1>Assignments</h1>
          <p>View and manage your course assignments.</p>
        </div>

        <div className="assignment-count">
          {assignments.length} Assignments
        </div>
      </div>

      <div className="assignments-list">

        {rows.map((assignment: LegacyValue, index: LegacyValue) => (
          <div className="assignment-card" key={index}>

            <div className="assignment-icon">
              ✓
            </div>

            <div className="assignment-info">

              <div className="assignment-title">
                <h2>{assignment.title}</h2>

                <span
                  className={
                    assignment.status === "Submitted"
                      ? "submitted"
                      : "pending"
                  }
                >
                  {assignment.status}
                </span>
              </div>

              <p>{assignment.course}</p>

              <div className="assignment-details">
                <span>📚 {assignment.batch}</span>
                <span>📅 Due: {assignment.dueDate}</span>
              </div>

            </div>

            <div className="assignment-action">

              <button className="view-assignment-btn" onClick={() => openAssignment(assignment)}>
                View Assignment
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Assignments;
