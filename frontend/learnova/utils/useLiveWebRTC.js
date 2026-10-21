import { useCallback, useEffect, useRef, useState } from "react";
import { liveSignalingUrl } from "./liveSignaling";
import { getBatchState, requestScreenShare, resolveScreenShare, studentId, teacherId } from "./batchStorage";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const videoSender = peer => peer.getTransceivers().find(item => item.receiver.track.kind === "video")?.sender;

export default function useLiveWebRTC({ classId, role, active, message }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingIceRef = useRef(new Map());
  const [connectionState, setConnectionState] = useState("Connecting...");
  const [mediaState, setMediaState] = useState({ mic: role === "teacher", camera: role === "teacher", screen: false });
  const admittedRef = useRef(false);
  const terminalRef = useRef(false);
  const [room, setRoom] = useState({ admitted: false, waiting: [], participants: [], chat: [], locked: false, recording: false, selfPeerId: "", denied: "" });
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [error, setError] = useState("");

  const report = useCallback(value => {
    setError(value instanceof Error ? value.message : String(value));
    if (message) message(value instanceof Error ? value.message : String(value));
  }, [message]);

  const closePeer = useCallback(peerId => {
    const peer = peersRef.current.get(peerId);
    peersRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    if (peer) {
      const removedTracks = peer.getReceivers().map(receiver => receiver.track);
      const current = remoteVideoRef.current?.srcObject;
      if (current?.getTracks().some(track => removedTracks.includes(track))) {
        const remaining = [...peersRef.current.values()].find(item => role === "teacher" || item.peerRole === "teacher");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remaining ? new MediaStream(remaining.getReceivers().map(receiver => receiver.track)) : null;
      }
      peer.close();
    }
    setRemoteStreams(value => value.filter(item => item.peerId !== peerId));
  }, [role]);

  const createPeer = useCallback((peerId, peerRole) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(peerId, peer);
    const stream = localStreamRef.current;
    stream?.getTracks().forEach(track => peer.addTrack(track, stream));
    if (!stream?.getVideoTracks().length) peer.addTransceiver("video", { direction: "sendrecv" });
    if (!stream?.getAudioTracks().length) peer.addTransceiver("audio", { direction: "sendrecv" });
    peer.onicecandidate = event => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ice-candidate", target: peerId, candidate: event.candidate }));
      }
    };
    peer.ontrack = event => {
      const remoteStream = event.streams[0] || peer.remoteStream || new MediaStream();
      peer.remoteStream = remoteStream;
      if (!remoteStream.getTracks().includes(event.track)) remoteStream.addTrack(event.track);
      setRemoteStreams(value => [...value.filter(item => item.peerId !== peerId), { peerId, stream: remoteStream, role: peerRole }]);
      if (remoteVideoRef.current && (role === "teacher" || peerRole === "teacher")) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    };
    peer.onconnectionstatechange = () => {
      if (peersRef.current.get(peerId) !== peer) return;
      // ICE can recover from a brief disconnect. Closing it immediately prevents recovery.
      if (peer.connectionState === "disconnected") setConnectionState("Reconnecting...");
      else if (peer.connectionState === "failed") socketRef.current?.close();
      else setConnectionState(peer.connectionState);
    };
    peer.peerRole = peerRole;
    return peer;
  }, [closePeer, role]);

  const sendOffer = useCallback(async (peerId, peerRole) => {
    const peer = createPeer(peerId, peerRole);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.send(JSON.stringify({ type: "offer", target: peerId, offer }));
  }, [createPeer]);

  const renegotiate = useCallback(async (peerId, peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.send(JSON.stringify({ type: "offer", target: peerId, offer }));
  }, []);

  useEffect(() => {
    if (!active || !classId || (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1")) return undefined;
    const resumeKey = `learnova-room-${classId}-${role}`;
    let resumeToken = sessionStorage.getItem(resumeKey);
    if (!resumeToken) { resumeToken = crypto.randomUUID(); sessionStorage.setItem(resumeKey, resumeToken); }
    let disposed = false;
    terminalRef.current = false;
    let reconnectTimer;
    const peers = peersRef.current;
    const pendingIce = pendingIceRef.current;
    async function start() {
      try {
        if (role === "teacher") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
            cameraStreamRef.current = stream;
            localStreamRef.current = stream;
            if (localVideoRef.current) { localVideoRef.current.srcObject = stream; localVideoRef.current.muted = true; await localVideoRef.current.play().catch(() => {}); }
          } catch (mediaError) {
            if (disposed) return;
            report(mediaError.name === "NotAllowedError" ? "Camera or microphone permission was denied. You can still share your screen." : "Camera or microphone is not available. You can still share your screen.");
          }
        }
        if (disposed) return;
        function connect() {
        if (disposed) return;
        const socket = new WebSocket(liveSignalingUrl());
        socketRef.current = socket;
        socket.onopen = () => {
          if (disposed || socketRef.current !== socket) { socket.close(); return; }
          setConnectionState("Connected");
          socket.send(JSON.stringify({ type: "join-room", classId, role, resumeToken, participantId: role === "teacher" ? teacherId : studentId, name: role === "teacher" ? "Teacher" : "Student", waitingRoom: role === "teacher", requireAdmission: role === "student" }));
        };
        socket.onerror = () => { if (!disposed) report("Live connection interrupted. Reconnecting to the signaling server..."); };
        socket.onclose = () => {
          if (disposed || socketRef.current !== socket) return;
          socketRef.current = null;
          for (const peerId of [...peers.keys()]) closePeer(peerId);
          pendingIce.clear();
          setConnectionState("Reconnecting...");
          reconnectTimer = window.setTimeout(connect, 1000);
        };
        socket.onmessage = async event => {
          try {
            const data = JSON.parse(event.data);
            if (disposed || socketRef.current !== socket) return;
            if (data.type === "room-state") {
              admittedRef.current = data.admitted;
              setRoom(value => ({ ...value, ...data }));
            }
            if (data.type === "waiting-room") { admittedRef.current = false; setConnectionState("Waiting for teacher admission"); }
            if (data.type === "entry-denied" || data.type === "class-ended") {
              terminalRef.current = true; admittedRef.current = false;
              setRoom(value => ({ ...value, admitted: false, denied: data.message || "This class has ended." }));
              for (const peerId of [...peers.keys()]) closePeer(peerId);
              cameraStreamRef.current?.getTracks().forEach(track => track.stop());
              screenStreamRef.current?.getTracks().forEach(track => track.stop());
              socket.close();
            }
            if (data.type === "force-mute") {
              cameraStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = false; });
              setMediaState(value => ({ ...value, mic: false }));
              report("Your teacher muted your microphone. You can unmute when ready.");
            }
            if (data.type === "room-joined") {
              admittedRef.current = true;
              socket.send(JSON.stringify({ type: "participant-state", mic: !!cameraStreamRef.current?.getAudioTracks().some(track => track.enabled), camera: !!cameraStreamRef.current?.getVideoTracks().some(track => track.enabled) }));
            }
            if (data.type === "screen-share-request" && role === "teacher") requestScreenShare(classId, data.participantId);
            if (data.type === "screen-share-decision" && role === "student" && data.participantId === studentId) {
              const liveClass = getBatchState().classes.find(item => item.id === classId);
              if (liveClass) resolveScreenShare(classId, studentId, data.approved, liveClass.teacherId);
            }
            if (data.type === "room-joined" && role === "teacher") {
              for (const peer of data.peers || []) if (peer.role === "student") await sendOffer(peer.peerId, peer.role);
            }
            if (data.type === "room-joined" && role === "student") {
              for (const peer of data.peers || []) if (peer.role === "student") await sendOffer(peer.peerId, peer.role);
            }
            if (data.type === "peer-joined" && role === "teacher" && data.role === "student") await sendOffer(data.peerId, data.role);
            if (data.type === "offer") {
              const peer = createPeer(data.peerId || data.senderId, data.role);
              await peer.setRemoteDescription(data.offer);
              for (const candidate of pendingIceRef.current.get(data.peerId) || []) await peer.addIceCandidate(candidate);
              pendingIceRef.current.delete(data.peerId);
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              socket.send(JSON.stringify({ type: "answer", target: data.peerId, answer }));
            }
            if (data.type === "answer") {
              const peer = peersRef.current.get(data.peerId);
              if (peer) {
                await peer.setRemoteDescription(data.answer);
                for (const candidate of pendingIceRef.current.get(data.peerId) || []) await peer.addIceCandidate(candidate);
                pendingIceRef.current.delete(data.peerId);
              }
            }
            if (data.type === "ice-candidate") {
              const peer = peersRef.current.get(data.peerId);
              if (peer?.remoteDescription) await peer.addIceCandidate(data.candidate);
              else pendingIceRef.current.set(data.peerId, [...(pendingIceRef.current.get(data.peerId) || []), data.candidate]);
            }
            if (data.type === "peer-left") closePeer(data.peerId);
          } catch (eventError) { report(eventError); }
        };
        }
        connect();
      } catch (mediaError) {
        report(mediaError.name === "NotAllowedError" ? "Camera or microphone permission was denied." : "Camera or microphone is not available.");
      }
    }
    start();
    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "leave-room", classId }));
      socketRef.current?.close();
      peers.forEach(peer => peer.close());
      peers.clear();
      pendingIce.clear();
      const localStream = localStreamRef.current;
      const screenStream = screenStreamRef.current;
      const cameraStream = cameraStreamRef.current;
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
      cameraStream?.getTracks().forEach(track => track.stop());
      socketRef.current = null;
      localStreamRef.current = null;
      cameraStreamRef.current = null;
      screenStreamRef.current = null;
    };
  }, [active, classId, closePeer, createPeer, role, report, sendOffer]);

  const toggleTrack = useCallback(async kind => {
    if (!admittedRef.current || terminalRef.current) return;
    try {
      let stream = cameraStreamRef.current;
      let track = stream?.getTracks().find(item => item.kind === kind && item.readyState === "live");
      if (track) track.enabled = !track.enabled;
      else {
        const capture = await navigator.mediaDevices.getUserMedia({ video: kind === "video", audio: kind === "audio" });
        if (!admittedRef.current || terminalRef.current) { capture.getTracks().forEach(item => item.stop()); return; }
        track = capture.getTracks().find(item => item.kind === kind);
        if (!stream) stream = new MediaStream();
        capture.getTracks().forEach(item => stream.addTrack(item));
        cameraStreamRef.current = stream;
        if (!screenStreamRef.current) localStreamRef.current = stream;
        if (screenStreamRef.current && kind === "audio") localStreamRef.current.addTrack(track);
        for (const [peerId, peer] of peersRef.current) {
          if (kind === "video" && screenStreamRef.current) continue;
          const transceiver = peer.getTransceivers().find(item => item.receiver.track.kind === kind);
          if (transceiver) { await transceiver.sender.replaceTrack(track); transceiver.sender.setStreams(localStreamRef.current); transceiver.direction = "sendrecv"; }
          else peer.addTrack(track, localStreamRef.current);
          await renegotiate(peerId, peer);
        }
        if (localVideoRef.current) { localVideoRef.current.srcObject = localStreamRef.current; localVideoRef.current.muted = true; }
      }
      setMediaState(value => ({ ...value, [kind === "audio" ? "mic" : "camera"]: track.enabled }));
      socketRef.current?.send(JSON.stringify({ type: "participant-state", [kind === "audio" ? "mic" : "camera"]: track.enabled }));
    } catch (error) { report(error); }
  }, [renegotiate, report]);

  const restoreCamera = useCallback(() => {
    const camera = cameraStreamRef.current?.getVideoTracks()[0];
    peersRef.current.forEach(peer => videoSender(peer)?.replaceTrack(camera || null).catch(report));
    if (screenStreamRef.current) screenStreamRef.current.getVideoTracks().forEach(track => { track.onended = null; });
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = cameraStreamRef.current;
    if (localVideoRef.current) localVideoRef.current.srcObject = cameraStreamRef.current;
    setMediaState(value => ({ ...value, screen: false }));
  }, [report]);

  const toggleScreen = useCallback(async () => {
    if (!admittedRef.current || terminalRef.current) return;
    if (mediaState.screen) {
      restoreCamera();
      return;
    }
    if (role === "student" && (socketRef.current?.readyState !== WebSocket.OPEN || ![...peersRef.current.values()].some(peer => peer.connectionState === "connected"))) {
      report("Wait for the live connection to reconnect before sharing your screen.");
      return;
    }
    if (role === "student" && !getBatchState().classes.find(item => item.id === classId)?.screenShareApproved?.includes(studentId)) {
      report("Your teacher must approve screen sharing first.");
      return;
    }
    let screenStream;
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      const outboundStream = new MediaStream([screenTrack, ...(cameraStreamRef.current?.getAudioTracks() || [])]);
      for (const [peerId, peer] of peersRef.current) {
        const sender = videoSender(peer);
        if (sender) {
          sender.setStreams(outboundStream);
          await sender.replaceTrack(screenTrack);
        } else peer.addTrack(screenTrack, outboundStream);
        if (role === "student") {
          const transceiver = peer.getTransceivers().find(item => item.sender.track === screenTrack);
          if (transceiver) transceiver.direction = "sendrecv";
          // The initial student answer is receive-only. Await the new offer before
          // reporting sharing as active, so the teacher can receive the track.
          await renegotiate(peerId, peer);
        }
      }
      screenTrack.onended = restoreCamera;
      screenStreamRef.current = screenStream;
      localStreamRef.current = outboundStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = outboundStream;
      setMediaState(value => ({ ...value, screen: true }));
    } catch (screenError) {
      screenStream?.getTracks().forEach(track => track.stop());
      if (screenError.name !== "AbortError") report("Screen sharing could not be started.");
    }
  }, [classId, mediaState.screen, renegotiate, report, restoreCamera, role]);

  const sendScreenControl = useCallback((type, values = {}) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) throw new Error("Live connection is reconnecting. Please try again when connected.");
    socketRef.current.send(JSON.stringify({ type, ...values }));
  }, []);

  return { room, remoteStreams, localVideoRef, remoteVideoRef, mediaState,
    sendChat: text => sendScreenControl("room-chat", { text }),
    raiseHand: hand => sendScreenControl("participant-state", { hand }),
    admit: target => sendScreenControl("admit-participant", { target }),
    control: (action, target, locked) => sendScreenControl("room-control", { action, target, locked }), connectionState, error, toggleMic: () => toggleTrack("audio"), toggleCamera: () => toggleTrack("video"), toggleScreen,
    requestScreenShare: () => sendScreenControl("screen-share-request"),
    decideScreenShare: (participantId, approved) => sendScreenControl("screen-share-decision", { participantId, approved }),
  };
}
