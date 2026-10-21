"use client";

import type { LegacyValue } from "../../../lib/legacy-types";
import { useEffect, useRef, useState, type FormEvent } from "react";
import LiveConferencePanel, { LiveGallery } from "../../components/LiveConferencePanel";
import LiveMaterialPreview from "../../components/LiveMaterialPreview";
import { useNavigate, useParams } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";
import { endClass, resolveScreenShare, teacherId, uploadLectureMaterial, shareLectureMaterial, stopSharingLectureMaterial, joinLiveSession, updateLiveParticipant } from "../../utils/batchStorage";
import useLiveWebRTC from "../../utils/useLiveWebRTC";


export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useBatches();
  const liveClass = state.classes.find((item: LegacyValue) => item.id === id);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  const [materialNotes, setMaterialNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadInFlight = useRef(false);
  const webrtc = useLiveWebRTC({ classId: id, role: "teacher", active: liveClass?.status === "Live" && liveClass.teacherId === teacherId, message: setMessage });
  useEffect(() => {
    const timer = window.setInterval(() => setNow((value: LegacyValue) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const participant = liveClass?.participants?.find((item: LegacyValue) => item.id === teacherId);
  useEffect(() => {
    if (liveClass?.status === "Live" && !participant) {
      try { joinLiveSession(id, teacherId, liveClass.teacher || "Teacher", "Teacher"); } catch (error: LegacyValue) { window.setTimeout(() => setMessage(error.message), 0); }
    }
  }, [id, liveClass?.status, participant, liveClass?.teacher]);
  if (!liveClass || liveClass.teacherId !== teacherId || !["Live", "Completed"].includes(liveClass.status)) return <section className="live-room"><h1>Class unavailable</h1><p>This live room is only available to the assigned teacher while the class is live.</p><button onClick={() => navigate("/teacher/live-classes")}>Back to Live Classes</button></section>;
  const participants = webrtc.room.participants.map((item: LegacyValue) => ({ ...item, id: item.participantId }));
  const elapsed = liveClass.status === "Completed" && liveClass.endedAt && liveClass.startedAt ? Math.max(0, Math.floor(((new Date(liveClass.endedAt) as unknown as number) - (new Date(liveClass.startedAt) as unknown as number)) / 1000)) : now;
  const timerLabel = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  function update(updates: LegacyValue) { try { updateLiveParticipant(id, teacherId, updates); } catch (error: LegacyValue) { setMessage(error.message); } }

  function finish() {
    if (webrtc.room.recording) { setMessage("Stop recording and download it before ending the class."); return; }
    try { endClass(id, teacherId); navigate("/teacher/live-classes"); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  function resolve(student: LegacyValue, approved: LegacyValue) {
    try { resolveScreenShare(id, student, approved, teacherId); webrtc.decideScreenShare(student, approved); setMessage(`${approved ? "Approved" : "Rejected"} screen share request.`); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadInFlight.current) return;
    const form = event.currentTarget;
    const file = (form.elements.namedItem("material") as HTMLInputElement).files?.[0];
    uploadInFlight.current = true;
    try {
      setUploading(true);
      await uploadLectureMaterial(id, file, materialNotes, teacherId);
      form.reset();
      setMaterialNotes("");
      setMessage("Material uploaded. Choose Share with Students to display it in the class.");
    } catch (error: LegacyValue) {
      setMessage(error.message);
    } finally {
      setUploading(false);
      uploadInFlight.current = false;
    }
  }

  const materials = state.materials.filter((item: LegacyValue) => item.classId === liveClass.id);
  const activeMaterial = materials.find((item: LegacyValue) => item.id === liveClass.activeSharedMaterial?.materialId);
  function shareMaterial(materialId: LegacyValue) { try { shareLectureMaterial(id, materialId); } catch (error: LegacyValue) { setMessage(error.message); } }
  function stopMaterialSharing() { try { stopSharingLectureMaterial(id); } catch (error: LegacyValue) { setMessage(error.message); } }
  return <section className="live-room">
    <header><div><span className="live-room-badge">{liveClass.status === "Live" ? "LIVE" : "COMPLETED"}</span><h1>{liveClass.title}</h1><p>{liveClass.course} | {liveClass.batch} | {liveClass.teacher} | {timerLabel}</p></div>{liveClass.status === "Live" ? <button className="live-room-end" onClick={finish}>End Class</button> : <button className="live-room-end" onClick={() => navigate("/teacher/live-classes")}>Back to Classes</button>}</header>
    {!webrtc.room.admitted && liveClass.status === "Live" && <LiveConferencePanel conference={webrtc} host={true} classId={String(id)} />}
    <div className="live-room-grid" hidden={!webrtc.room.admitted && liveClass.status === "Live"}><main><div className="live-stage"><LiveMaterialPreview material={activeMaterial} /><video hidden={!!activeMaterial} ref={webrtc.localVideoRef} autoPlay playsInline muted aria-label="Teacher camera preview" /><video hidden={!!activeMaterial} className="live-remote-preview" muted ref={webrtc.remoteVideoRef} autoPlay playsInline aria-label="Student shared screen" /><strong>{webrtc.connectionState}</strong><span>{webrtc.mediaState.camera ? "Camera on" : "Camera off"} | {webrtc.mediaState.mic ? "Microphone on" : "Microphone muted"}</span>{webrtc.mediaState.screen && <small>Screen sharing enabled</small>}{participants.filter((item: LegacyValue) => item.id !== teacherId).map((item: LegacyValue) => <div className="live-participant-tile" key={item.id}>{item.name} — Student ({item.camera ? "Camera on" : "Camera off"})</div>)}</div><LiveGallery conference={webrtc} host /><div className="live-room-controls"><button onClick={() => { webrtc.toggleMic(); update({ mic: !webrtc.mediaState.mic }); }}>{webrtc.mediaState.mic ? "Mute" : "Unmute"} Microphone</button><button onClick={() => { webrtc.toggleCamera(); update({ camera: !webrtc.mediaState.camera }); }}>{webrtc.mediaState.camera ? "Turn Camera Off" : "Turn Camera On"}</button><button onClick={() => webrtc.toggleScreen()}>{webrtc.mediaState.screen ? "Stop Screen Share" : "Share Screen"}</button><button type="button" onClick={() => setMessage(`${participants.length} participant${participants.length === 1 ? "" : "s"} in this session.`)}>Participants</button></div><p className="live-room-note">Connected classroom. Admit students from the waiting room and manage participation above.</p><section className="live-material-upload"><h2>Lecture Materials</h2><p>Optional: share a PDF, image, document, or presentation. You can continue teaching without uploading one.</p><form onSubmit={upload}><input name="material" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" required /><textarea value={materialNotes} onChange={(event: LegacyValue) => setMaterialNotes(event.target.value)} placeholder="Material notes (optional)" rows={"2" as unknown as number} /><button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload Material"}</button>    </form>{materials.map((material: LegacyValue) => <p className="live-material-item" key={material.id}>{material.fileName} <button type="button" onClick={() => shareMaterial(material.id)}>{liveClass.activeSharedMaterial?.materialId === material.id ? "Sharing" : "Share with Students"}</button></p>)}{liveClass.activeSharedMaterial && <p role="status">Sharing: {liveClass.activeSharedMaterial.name} <button type="button" onClick={stopMaterialSharing}>Stop Sharing</button></p>}</section></main><aside className="live-room-panel"><LiveConferencePanel conference={webrtc} host={true} classId={String(id)} /><h2>Student Screen Share Requests</h2>{(liveClass.screenShareRequests || []).map((student: LegacyValue) => <div className="live-request" key={student}><span>{student}</span><button onClick={() => resolve(student, true)}>Approve</button><button onClick={() => resolve(student, false)}>Reject</button></div>)}{!(liveClass.screenShareRequests || []).length && <p>No pending requests.</p>}</aside></div>{message && <p role="status">{message}</p>}</section>;
}
