type Material = { fileName?: string; fileType?: string; fileUrl?: string; notes?: string };

export default function LiveMaterialPreview({ material }: { material?: Material }) {
  if (!material) return null;
  return <div className="live-shared-material" aria-label="Shared lecture material" style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, background: "var(--learnova-surface)", color: "var(--learnova-navy)" }}>
    <strong>{material.fileName}</strong>
    {material.notes && <p style={{ whiteSpace: "pre-wrap" }}>{material.notes}</p>}
    {material.fileUrl ? <>
      {(material.fileType?.startsWith("image/") && material.fileType !== "image/svg+xml") ?
        // eslint-disable-next-line @next/next/no-img-element -- Uploaded same-origin file, no image optimization required.
        <img src={material.fileUrl} alt={material.fileName || "Shared lecture material"} style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }} /> :
        ["application/pdf", "text/plain"].includes(material.fileType || "") ? <iframe src={material.fileUrl} title={material.fileName || "Shared lecture material"} style={{ width: "100%", height: 400, border: 0 }} /> : null}
      <p><a href={material.fileUrl} target="_blank" rel="noreferrer">Open / Download material</a></p>
    </> : <p>This older upload has no saved file. Ask your teacher to upload it again.</p>}
  </div>;
}
