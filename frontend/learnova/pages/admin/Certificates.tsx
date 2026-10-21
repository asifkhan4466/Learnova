import type { LegacyValue } from "../../../lib/legacy-types";
import AdminSummary, { AdminHeading } from "../../components/AdminSummary";

import { useState, useRef, useEffect } from "react";
import useCertificates from "../../utils/useCertificates";
import { readCertificateTemplate, saveCertificateTemplate } from "../../utils/certificateStorage";
import { certificateDate, downloadCertificate, drawCertificate } from "../../utils/certificateDocument";
import CertificatePreview from "../../components/CertificatePreview";

function Certificates({ subadminView = false }: LegacyValue) {
  const { state, records, error: storageError } = useCertificates();
  const [error, setError] = useState("");
  const templateCanvas = useRef<LegacyValue>(null);
  useEffect(() => {
    if (subadminView && !state.template && templateCanvas.current) {
      drawCertificate(templateCanvas.current, {studentName:"STUDENT NAME",courseName:"COURSE NAME",instructorName:"Instructor Name",authorizedName:"Learnova Administration",completionDate:null,certificateId:"Assigned on completion"}, null).catch((failure: LegacyValue) => setError(failure.message));
    }
  }, [subadminView, state.template]);
  const [preview, setPreview] = useState<LegacyValue>(null);
  const [details, setDetails] = useState<LegacyValue>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function upload(event: LegacyValue) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setNotice("");
    try { const template = await readCertificateTemplate(file); saveCertificateTemplate(template); setNotice("Certificate template saved."); }
    catch (failure: LegacyValue) { setError(failure.message); }
    finally { setBusy(false); event.target.value = ""; }
  }
  async function download(id: LegacyValue) { setBusy(true); setError(""); try { await downloadCertificate(id); setNotice("Certificate download prepared."); } catch (failure: LegacyValue) { setError(failure.message); } finally { setBusy(false); } }
  const detail = records.find((r: LegacyValue) => r.id === details);
  const selected = records.find((r: LegacyValue) => r.id === preview);
  return <div className="subadmin-certificates-page">
    {subadminView ? <AdminHeading title="Certificates" subtitle="Manage certificate templates and course completion certificates." icon="award"/> : <header className="subadmin-certificates-header"><h1>Certificates</h1><p>Manage certificate templates and course completion certificates.</p></header>}
    {subadminView ? <AdminSummary items={[["Certificates",records.filter((r: LegacyValue)=>r.certificateId).length,"award"],["Available / Issued",records.filter((r: LegacyValue)=>r.status!=="Locked").length,"check"],["Pending Eligibility",records.filter((r: LegacyValue)=>r.status==="Locked").length,"clock"],["Templates",1,"book"]]}/> : <div className="subadmin-certificate-stats">{[["Total Certificates", records.filter((r: LegacyValue) => r.certificateId).length], ["Available / Issued", records.filter((r: LegacyValue) => r.status !== "Locked").length], ["Pending Eligibility", records.filter((r: LegacyValue) => r.status === "Locked").length], ["Certificate Templates", 1]].map(([label, count]: LegacyValue) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>}
    <section className="subadmin-certificate-template">
      <div><h2>Certificate Template</h2><p>{state.template ? state.template.name : "Built-in Learnova certificate"}</p><p>Upload a blank PNG or JPG/JPEG template, up to 2 MB. Student and course details are placed automatically over the image.</p>
        <div className="subadmin-certificate-actions"><label className="certificate-upload-button">{busy ? "Please wait…" : state.template ? "Replace Template" : "Upload Certificate Template"}<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" disabled={busy} onChange={upload} aria-label="Upload Certificate Template" /></label><button type="button" onClick={() => setPreview("template")}>Preview Template</button></div>
      </div>
      {state.template ? <img src={state.template.dataUrl} alt="Current certificate template" /> : subadminView ? <canvas ref={templateCanvas} className="sa-template-canvas" aria-label="Learnova certificate template with automatic fields"/> : <div className="certificate-default-template"><img src="/Logo.png" alt="Learnova" /><strong>CERTIFICATE OF COMPLETION</strong><span>Automatic student and course information</span></div>}
    </section>
    {(error || storageError) && <p role="alert">{error || storageError}</p>}{notice && <p role="status">{notice}</p>}
    <section className="subadmin-certificate-records"><h2>Certificate Records</h2><p>Certificates unlock at 100% progress or Completed status. Issued means a download has been prepared.</p>
      <div className="subadmin-certificate-table-wrap" tabIndex={"0" as unknown as number} aria-label="Certificate records"><table><thead><tr>{["Student", "Student ID", "Course", "Instructor", "Completion Date", "Certificate ID", "Status", "Action"].map((label: LegacyValue) => <th key={label}>{label}</th>)}</tr></thead><tbody>{records.map((record: LegacyValue) => <tr key={record.id}>
        <td>{record.studentName}</td><td>{record.studentId}</td><td>{record.courseName}</td><td>{record.instructorName}</td><td>{certificateDate(record.completionDate)}</td><td className="certificate-id-cell">{record.certificateId || "Pending"}</td><td><span className={`certificate-status certificate-status-${record.status.toLowerCase()}`}>{record.status}</span></td>
        <td><div className="subadmin-certificate-actions"><button type="button" disabled={record.status === "Locked"} onClick={() => setPreview(record.id)}>Preview</button><button type="button" disabled={record.status === "Locked" || busy} onClick={() => download(record.id)}>Download</button><button type="button" onClick={() => setDetails(record.id)}>View Details</button></div></td>
      </tr>)}</tbody></table></div>
    </section>
    {detail && <section className="certificate-record-details"><h2>Certificate Details</h2><p>{detail.studentName} · {detail.studentId}</p><p>{detail.courseName} · Instructor: {detail.instructorName}</p><p>Progress: {detail.progress}% · Course status: {detail.status === "Locked" ? detail.progress === 100 ? "Course unavailable" : "Not eligible" : "Completed"}</p><p>Authorized By: {detail.authorizedName}</p><p>Completion: {certificateDate(detail.completionDate)}</p><p>Certificate ID: {detail.certificateId || "Pending completion"}</p><button type="button" onClick={() => setDetails(null)}>Close Details</button></section>}
    {preview && <CertificatePreview record={selected} template={state.template} templateOnly={preview === "template"} onClose={() => setPreview(null)} />}
  </div>;
}
export default Certificates;
