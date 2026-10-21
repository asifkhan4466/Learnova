import type { LegacyValue } from "../../lib/legacy-types";

import { useEffect, useRef, useState } from "react";
import { drawCertificate, certificateDate, downloadCertificate } from "../utils/certificateDocument";

function CertificatePreview({ record, template, onClose, templateOnly = false }: LegacyValue) {
  const dialog = useRef<LegacyValue>(null);
  const canvas = useRef<LegacyValue>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { dialog.current.showModal(); }, []);
  useEffect(() => {
    let active = true;
    if ((!templateOnly || !template) && record?.status !== "Locked") {
      const fields = record || { studentName: "STUDENT NAME", courseName: "COURSE NAME", instructorName: "Instructor Name", authorizedName: "Learnova Administration", completionDate: null, certificateId: "Assigned on completion" };
      drawCertificate(canvas.current, fields, template).catch((failure: LegacyValue) => { if (active) setError(failure.message); });
    }
    return () => { active = false; };
  }, [record, template, templateOnly]);
  async function download() { setBusy(true); setError(""); try { await downloadCertificate(record.id); } catch (failure: LegacyValue) { setError(failure.message); } finally { setBusy(false); } }
  return <dialog ref={dialog} className="certificate-preview-dialog" aria-labelledby="certificate-preview-title" onClose={onClose}>
    <div className="certificate-preview-toolbar"><h2 id="certificate-preview-title">{templateOnly ? "Certificate Template" : "Certificate Preview"}</h2><button type="button" onClick={() => dialog.current.close()}>Close</button></div>
    {templateOnly ? template ? <img className="certificate-template-full" src={template.dataUrl} alt={template.name} /> : <canvas ref={canvas} className="certificate-document" role="img" aria-label="Built-in Learnova certificate template with placeholder fields" /> : record?.status === "Locked" ? <p>Course completion is required. This certificate is locked.</p> : <>
      <canvas ref={canvas} className="certificate-document" role="img" aria-label={`Certificate of completion for ${record.studentName}, ${record.courseName}. Instructor: ${record.instructorName}. Authorized by ${record.authorizedName}. ${certificateDate(record.completionDate)}. ${record.certificateId}`} />
      <p className="certificate-preview-caption">{record.studentName} · {record.courseName} · {record.certificateId}</p>
      <button className="certificate-preview-download" type="button" disabled={busy || !!error} onClick={download}>{busy ? "Preparing…" : "Download Certificate (PNG)"}</button>
    </>}
    {error && <p role="alert">{error}</p>}
  </dialog>;
}
export default CertificatePreview;
