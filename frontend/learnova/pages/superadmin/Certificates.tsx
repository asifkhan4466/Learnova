import type { LegacyValue } from "../../../lib/legacy-types";
﻿
import { useState } from "react";
import CertificatesManagement from "../admin/Certificates";
import useCertificates from "../../utils/useCertificates";
import PublicIcon from "../../components/PublicIcon";
import CertificatePreview from "../../components/CertificatePreview";
import { certificateDate } from "../../utils/certificateDocument";

export default function Certificates() {
  const { state, records } = useCertificates();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [previewId, setPreviewId] = useState<LegacyValue>(null);
  const matches = searched && query.trim() ? records.filter((record: LegacyValue) => record.certificateId && (record.certificateId.toLowerCase().includes(query.trim().toLowerCase()) || record.studentName.toLowerCase().includes(query.trim().toLowerCase()))) : [];
  const preview = records.find((record: LegacyValue) => record.id === previewId);
  return <section className="admin-certificates">
    <header className="adc-banner"><div><h1>Certificates</h1><p>Manage certificate templates, track issuance, and celebrate learner achievements.</p></div><blockquote>&ldquo;Recognizing progress,<br/>empowering brighter futures.&rdquo;<cite>&mdash; Learnova</cite></blockquote><PublicIcon name="award"/></header>
    <div className="adc-workspace"><CertificatesManagement/>
      <section className="adc-verify"><header><PublicIcon name="award"/><div><h2>Find Certificate</h2><p>Look up a certificate in the shared frontend records.</p></div></header><form onSubmit={(event: LegacyValue) => { event.preventDefault(); setSearched(true); }}><label htmlFor="adc-search">Certificate ID or student name</label><div className="adc-search"><PublicIcon name="search"/><input id="adc-search" required value={query} onChange={(event: LegacyValue) => { setQuery(event.target.value); setSearched(false); }} placeholder="Enter certificate ID or student name..."/></div><button type="submit">Search Certificate</button></form>
      {searched && <div className="adc-results" role="status">{matches.length ? matches.map((record: LegacyValue) => <article key={record.id}><strong>{record.studentName}</strong><p>{record.courseName}</p><small>{record.certificateId} · {certificateDate(record.completionDate)}</small><span>{record.status}</span><button disabled={record.status === "Locked"} onClick={() => setPreviewId(record.id)}>Preview</button></article>) : <p>No matching certificate found.</p>}</div>}
      <div className="adc-note"><PublicIcon name="check"/><div><strong>Course completion certificates</strong><p>Certificate details are filled automatically. Certificates unlock only when course completion requirements are met.</p></div></div></section>
    </div>{preview && <CertificatePreview record={preview} template={state.template} onClose={() => setPreviewId(null)}/>}
  </section>;
}
