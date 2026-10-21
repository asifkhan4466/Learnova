import type { LegacyValue } from "../../../lib/legacy-types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import useBatches from "../../utils/useBatches";
import { canJoinClass, requestScreenShare, studentId, joinLiveSession, leaveLiveSession } from "../../utils/batchStorage";
import useLiveWebRTC from "../../utils/useLiveWebRTC";
import LiveConferencePanel, { LiveGallery } from "../../components/LiveConferencePanel";
import LiveMaterialPreview from "../../components/LiveMaterialPreview";


export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useBatches();
  const liveClass = state.classes.find((item: LegacyValue) => item.id === id);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  const webrtc = useLiveWebRTC({ classId: id, role: "student", active: liveClass?.status === "Live" && canJoinClass(studentId, liveClass, state), message: setMessage });
  useEffect(() => {
    const timer = window.setInterval(() => setNow((value: LegacyValue) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const participant = liveClass?.participants?.find((item: LegacyValue) => item.id === studentId);
  useEffect(() => {
    if (liveClass?.status === "Live" && !participant) {
      try { joinLiveSession(id, studentId, "Ahmed Khan", "Student"); } catch (error: LegacyValue) { window.setTimeout(() => setMessage(error.message), 0); }
    }
  }, [id, liveClass?.status, participant]);
  if (!liveClass || !["Live", "Completed"].includes(liveClass.status) || (liveClass.status === "Live" && !canJoinClass(studentId, liveClass, state))) return <section className="live-room"><h1>Class unavailable</h1><p>Waiting for the teacher to start this class, or your enrollment is not eligible for its active batch.</p><button onClick={() => navigate("/student/live-classes")}>Back to Live Classes</button></section>;
  const participants = webrtc.room.participants.map((item: LegacyValue) => ({ ...item, id: item.participantId }));
  const elapsed = liveClass.status === "Completed" && liveClass.endedAt && liveClass.startedAt ? Math.max(0, Math.floor(((new Date(liveClass.endedAt) as unknown as number) - (new Date(liveClass.startedAt) as unknown as number)) / 1000)) : now;
  const timerLabel = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const approved = liveClass.screenShareApproved?.includes(studentId);

  function request() {
    try { requestScreenShare(id, studentId); webrtc.requestScreenShare(); setMessage("Screen share request sent to your teacher."); }
    catch (error: LegacyValue) { setMessage(error.message); }
  }
  function leave() { try { leaveLiveSession(id, studentId); navigate("/student/live-classes"); } catch (error: LegacyValue) { setMessage(error.message); } }
  const materials = state.materials.filter((item: LegacyValue) => item.classId === liveClass.id && item.status === "Available");
  const activeMaterial = materials.find((item: LegacyValue) => item.id === liveClass.activeSharedMaterial?.materialId);
  return <section className="live-room">
    <header><div><span className="live-room-badge">{liveClass.status === "Live" ? "LIVE" : "COMPLETED"}</span><h1>{liveClass.title}</h1><p>{liveClass.course} | {liveClass.batch} | {liveClass.teacher} | {timerLabel}</p></div><button className="live-room-end" onClick={liveClass.status === "Live" ? leave : () => navigate("/student/live-classes")}>{liveClass.status === "Live" ? "Leave Class" : "Back to Live Classes"}</button></header>
    {liveClass.status === "Completed" && <p role="status">This live class has ended.</p>}
    {!webrtc.room.admitted && liveClass.status === "Live" && <LiveConferencePanel conference={webrtc} host={false} classId={String(id)} />}
    <div className="live-room-grid" hidden={!webrtc.room.admitted && liveClass.status === "Live"}><main><div className="live-stage"><LiveMaterialPreview material={activeMaterial} /><video hidden={!!activeMaterial} ref={webrtc.remoteVideoRef} autoPlay playsInline aria-label="Teacher live video" /><strong>{webrtc.connectionState}</strong><span>Teacher camera and microphone stream</span>{approved && <small>Your screen share is approved</small>}{participants.map((item: LegacyValue) => <div className="live-participant-tile" key={item.id}>{item.name} — {item.role} ({item.camera ? "Camera on" : "Camera off"})</div>)}</div><video className="live-self-preview" ref={webrtc.localVideoRef} autoPlay playsInline muted aria-label="My camera preview" /><LiveGallery conference={webrtc} /><div className="live-room-controls"><button disabled={liveClass.status !== "Live"} onClick={() => { void webrtc.toggleMic(); }}>{webrtc.mediaState.mic ? "Mute" : "Unmute"} Microphone</button><button disabled={liveClass.status !== "Live"} onClick={() => { void webrtc.toggleCamera(); }}>{webrtc.mediaState.camera ? "Turn Camera Off" : "Turn Camera On"}</button><button onClick={approved ? webrtc.toggleScreen : request} disabled={liveClass.status !== "Live"}>{approved ? (webrtc.mediaState.screen ? "Stop Screen Share" : "Share Screen") : "Request Screen Share"}</button><button type="button" onClick={() => setMessage(`${participants.length} participant${participants.length === 1 ? "" : "s"} in this session.`)}>Participants</button></div><p className="live-room-note">You can request screen sharing, but only your teacher can approve it.</p>    <section className="live-material-upload"><h2>Shared Lecture Materials</h2>{materials.length ? materials.map((material: LegacyValue) => <p className="live-material-item" key={material.id}>{material.fileName}</p>) : <p>No lecture material uploaded yet. You can continue the class.</p>}</section></main><aside className="live-room-panel"><LiveConferencePanel conference={webrtc} host={false} classId={String(id)} /></aside></div>{message && <p role="status">{message}</p>}</section>;
}
