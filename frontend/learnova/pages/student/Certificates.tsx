import type { LegacyValue } from "../../../lib/legacy-types";

import { useState } from "react";
import useCertificates from "../../utils/useCertificates";
import { DEMO_STUDENT_ID } from "../../utils/certificateStorage";
import { certificateDate, downloadCertificate } from "../../utils/certificateDocument";
import CertificatePreview from "../../components/CertificatePreview";

function Certificates() {
  const { state, records, error: storageError } = useCertificates();
  const certificates = records.filter((record: LegacyValue) => record.studentId === DEMO_STUDENT_ID);
  const [preview, setPreview] = useState<LegacyValue>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download(id: LegacyValue) { setBusy(true); setError(""); try { await downloadCertificate(id); } catch (failure: LegacyValue) { setError(failure.message); } finally { setBusy(false); } }

  return (
    <div className="certificates-page">

      <div className="certificates-header">
        <div>
          <h1>Certificates</h1>
          <p>View and download your course completion certificates.</p>
        </div>

        <div className="certificate-count">
          {certificates.filter(
            (certificate: LegacyValue) => certificate.status !== "Locked"
          ).length}{" "}
          Available
        </div>
      </div>

      {(error || storageError) && <p role="alert">{error || storageError}</p>}
      <div className="certificates-list">

        {certificates.map((certificate: LegacyValue) => (
          <div className="certificate-card" key={certificate.id}>

            <div className="certificate-icon">
              🎓
            </div>

            <div className="certificate-info">

              <div className="certificate-title">
                <h2>{certificate.courseName}</h2>

                <span
                  className={
                    certificate.status !== "Locked"
                      ? "certificate-available"
                      : "certificate-locked"
                  }
                >
                  {certificate.status}
                </span>
              </div>

              <p>Instructor: {certificate.instructorName}</p>

              <div className="certificate-details">
                <span>
                  📅 Completion: {certificateDate(certificate.completionDate)}
                </span>

                <span>
                  🆔 Certificate ID: {certificate.certificateId || "Pending"}
                </span>
              </div>

            </div>

            <div className="certificate-action">
              <button className="student-certificate-preview-btn" type="button" disabled={certificate.status === "Locked"} onClick={() => setPreview(certificate.id)}>Preview</button>

              <button
                className="download-certificate-btn"
                type="button"
                onClick={() => download(certificate.id)}
                disabled={certificate.status === "Locked" || busy}
              >
                Download Certificate
              </button>

            </div>

          </div>
        ))}

      </div>

      <div className="certificate-note">
        <strong>Certificate Information:</strong>
        <p>
          Your certificate becomes available after completing the required
          course progress. Available certificates can be downloaded as PNG documents.
        </p>
      </div>

      {preview && <CertificatePreview record={certificates.find((c: LegacyValue) => c.id === preview)} template={state.template} onClose={() => setPreview(null)} />}
    </div>
  );
}

export default Certificates;