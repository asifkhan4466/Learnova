import { getCertificateRecords, getCertificateState, markCertificateDownloaded } from "./certificateStorage";

// Percentage-based positions can be adjusted later without changing stored template pixels.
export const certificateFields = {
  studentName: { x: .5, y: .40, size: .047 },
  courseName: { x: .5, y: .55, size: .035 },
  instructorName: { x: .5, y: .65, size: .021 },
  authorizedName: { x: .5, y: .71, size: .021 },
  date: { x: .5, y: .78, size: .019 },
  certificateId: { x: .5, y: .84, size: .016 },
};
export function certificateDate(value) { return value ? new Date(value + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "Not Completed"; }
function imageFrom(source) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("Template image could not be loaded.")); image.src = source; }); }

export async function drawCertificate(canvas, record, template) {
  const width = 1600;
  const height = Math.round(width * (template ? template.height / template.width : .7));
  if (height > 10000 || height < 200) throw new Error("Use a certificate template with a standard portrait or landscape aspect ratio.");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  const style = getComputedStyle(document.documentElement);
  const navy = style.getPropertyValue("--learnova-navy").trim();
  const blue = style.getPropertyValue("--learnova-primary").trim();
  const surface = style.getPropertyValue("--learnova-white").trim();
  ctx.fillStyle = surface; ctx.fillRect(0, 0, width, height);
  if (template) ctx.drawImage(await imageFrom(template.dataUrl), 0, 0, width, height);
  else {
    ctx.strokeStyle = navy; ctx.lineWidth = 4; ctx.strokeRect(width*.025, height*.035, width*.95, height*.93);
    ctx.strokeStyle = blue; ctx.lineWidth = 1; ctx.strokeRect(width*.04, height*.055, width*.92, height*.89);
    const logo = await imageFrom("/Logo.png");
    const logoHeight = height*.14; ctx.drawImage(logo, width*.5-logoHeight*.5, height*.07, logoHeight, logoHeight);
  }
  // A light text panel keeps dynamic fields readable over uploaded artwork.
  ctx.globalAlpha = .94; ctx.fillStyle = surface; ctx.fillRect(width*.08, height*.21, width*.84, height*.66); ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  function text(value, x, y, size, bold = false) {
    let pixels = Math.min(width, height)*size;
    ctx.font = `${bold ? "600" : "400"} ${pixels}px Arial`;
    while (ctx.measureText(value).width > width*.78 && pixels > 8) { pixels--; ctx.font = `${bold ? "600" : "400"} ${pixels}px Arial`; }
    ctx.fillStyle = bold ? navy : blue;
    ctx.fillText(value, width*x, height*y);
  }
  text("CERTIFICATE OF COMPLETION", .5, .26, .034, true);
  text("This certificate is presented to", .5, .33, .021);
  text("for successfully completing", .5, .48, .021);
  const values = { studentName: record.studentName, courseName: record.courseName, instructorName: `Instructor: ${record.instructorName}`, authorizedName: `Authorized By: ${record.authorizedName}`, date: `Date: ${certificateDate(record.completionDate)}`, certificateId: `Certificate ID: ${record.certificateId}` };
  for (const [name, field] of Object.entries(certificateFields)) text(values[name], field.x, field.y, field.size, name === "studentName" || name === "courseName");
}

export async function downloadCertificate(enrollmentId) {
  const record = getCertificateRecords().find(r => r.id === enrollmentId);
  if (!record || record.status === "Locked") throw new Error("Course completion is required before downloading.");
  const canvas = document.createElement("canvas");
  await drawCertificate(canvas, record, getCertificateState().template);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The certificate could not be generated.");
  if (getCertificateRecords().find(r => r.id === enrollmentId)?.status === "Locked") throw new Error("Course completion is required before downloading.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `${record.certificateId}.png`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  markCertificateDownloaded(enrollmentId);
}
