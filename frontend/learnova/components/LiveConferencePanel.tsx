"use client";

import { useEffect, useRef, useState } from "react";
import type { LegacyValue } from "../../lib/legacy-types";

type Peer = { peerId: string; name: string; role: string; hand: boolean; mic: boolean; camera: boolean };

export function LiveGallery({ conference, host = false }: { conference: LegacyValue; host?: boolean }) {
  return <div className="live-gallery">{conference.remoteStreams.map((item: { peerId: string; stream: MediaStream; role: string }) => <StreamTile key={item.peerId} stream={item.stream} audible={host || item.role === "student"} label={conference.room.participants.find((peer: Peer) => peer.peerId === item.peerId)?.name || item.role} />)}</div>;
}
function StreamTile({ stream, label, audible }: { stream: MediaStream; label: string; audible: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (video.current) { video.current.srcObject = stream; video.current.play().catch(() => {}); } }, [stream]);
  // The teacher hears every student's stream here; students hear the main stage.
  return <figure><video ref={video} autoPlay playsInline muted={!audible} /><figcaption>{label}</figcaption></figure>;
}

export default function LiveConferencePanel({ conference, host, classId }: { conference: LegacyValue; host: boolean; classId: string }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [download, setDownload] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const downloadRef = useRef("");
  const mounted = useRef(true);
  const { room } = conference;
  const ownHand = room.participants.find((peer: Peer) => peer.peerId === room.selfPeerId)?.hand;
  function act(action: () => void) { try { action(); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Action failed. Please reconnect and try again."); } }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (recorder.current?.state === "recording") recorder.current.stop(); cleanup.current?.(); if (downloadRef.current) URL.revokeObjectURL(downloadRef.current); };
  }, []);
  useEffect(() => {
    if ((!room.admitted || room.denied) && recorder.current?.state === "recording") recorder.current.stop();
  }, [room.admitted, room.denied]);
  async function startRecording() {
    if (starting || recording) return;
    setStarting(true); setError("");
    let capture: MediaStream | undefined;
    let audio: AudioContext | undefined;
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices?.getDisplayMedia) throw Error("Recording is not supported by this browser. Use a supported desktop browser.");
      capture = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (!mounted.current || !room.admitted) { capture.getTracks().forEach(track => track.stop()); return; }
      audio = new AudioContext();
      await audio.resume();
      const destination = audio.createMediaStreamDestination();
      const sources = new Set<MediaStream>();
      // When tab audio is included it already contains the remote participants.
      if (capture.getAudioTracks().length) sources.add(capture);
      else conference.remoteStreams.forEach((item: { stream: MediaStream }) => sources.add(item.stream));
      const local = conference.localVideoRef.current?.srcObject as MediaStream | null;
      if (local) sources.add(local);
      for (const source of sources) if (source.getAudioTracks().length) audio.createMediaStreamSource(source).connect(destination);
      const output = new MediaStream([...capture.getVideoTracks(), ...destination.stream.getAudioTracks()]);
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const instance = new MediaRecorder(output, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      const captured = capture, context = audio;
      cleanup.current = () => { captured.getTracks().forEach(track => track.stop()); destination.stream.getTracks().forEach(track => track.stop()); void context.close().catch(() => {}); };
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      instance.onstop = () => {
        cleanup.current?.(); cleanup.current = null;
        if (!mounted.current) return;
        setRecording(false);
        if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
        const url = URL.createObjectURL(new Blob(chunks, { type: instance.mimeType || "video/webm" }));
        downloadRef.current = url; setDownload(url);
        try { conference.control("recording", undefined, false); } catch { /* Download remains available if signaling drops. */ }
      };
      instance.onerror = () => { if (mounted.current) setError("Recording failed. Stop and download any captured content before trying again."); };
      capture.getVideoTracks()[0].onended = () => { if (instance.state === "recording") instance.stop(); };
      recorder.current = instance;
      instance.start(1000); setRecording(true);
      conference.control("recording", undefined, true);
    } catch (reason) {
      capture?.getTracks().forEach(track => track.stop()); void audio?.close().catch(() => {});
      setError(reason instanceof Error ? reason.message : "Recording could not start.");
    } finally { if (mounted.current) setStarting(false); }
  }
  return <section className="conference-panel" aria-label="Classroom controls">
    {room.denied ? <p role="alert">{room.denied}</p> : !room.admitted ? <p role="status">Waiting room: your teacher will admit you shortly. Camera, audio and chat are unavailable until admission.</p> : <>
      <div className="conference-actions">
        {host ? <><button onClick={() => act(() => conference.control("lock", undefined, !room.locked))}>{room.locked ? "Unlock Classroom" : "Lock Classroom"}</button><button onClick={() => act(() => conference.control("mute"))}>Mute All Students</button><button disabled={starting} onClick={recording ? () => recorder.current?.stop() : startRecording}>{recording ? "Stop Recording" : starting ? "Starting Recording..." : "Start Recording"}</button></> : <button onClick={() => act(() => conference.raiseHand(!ownHand))}>{ownHand ? "Lower Hand" : "Raise Hand"}</button>}
      </div>
      {room.recording && <p role="status">Recording in progress. The teacher is recording this classroom.</p>}
      {host && <p className="live-room-note">To record, choose this classroom tab and include tab audio. Stop recording and download before leaving. Recordings are saved on this device, not uploaded automatically.</p>}
      {download && <a className="recording-download" href={download} download={`Learnova-${classId}.webm`}>Download Recording</a>}
      {host && <><h2>Waiting Room ({room.waiting.length})</h2>{room.waiting.map((peer: Peer) => <div className="conference-person" key={peer.peerId}><span>{peer.name}</span><button onClick={() => act(() => conference.admit(peer.peerId))}>Admit</button><button onClick={() => act(() => conference.control("remove", peer.peerId))}>Reject</button></div>)}</>}
      <h2>Participants ({room.participants.length})</h2>
      {room.participants.map((peer: Peer) => <div className="conference-person" key={peer.peerId}><span>{peer.name} | {peer.role}{peer.hand ? " | Hand raised" : ""}</span>{host && peer.role === "student" && <><button onClick={() => act(() => conference.control("mute", peer.peerId))}>Mute</button>{peer.hand && <button onClick={() => act(() => conference.control("lower-hand", peer.peerId))}>Lower Hand</button>}<button onClick={() => act(() => conference.control("remove", peer.peerId))}>Remove</button></>}</div>)}
      <h2>Class Chat</h2><div className="conference-chat" role="log" aria-label="Class chat">{room.chat.map((item: { id: string; senderName: string; message: string }) => <p key={item.id}><strong>{item.senderName}:</strong> {item.message}</p>)}</div>
      <form onSubmit={event => { event.preventDefault(); if (draft.trim()) act(() => { conference.sendChat(draft); setDraft(""); }); }}><label className="sr-only" htmlFor={`class-chat-${host ? "teacher" : "student"}`}>Class message</label><input id={`class-chat-${host ? "teacher" : "student"}`} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Message the class..." required /><button>Send to Class</button></form>
    </>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
