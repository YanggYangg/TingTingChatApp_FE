import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import Peer from "simple-peer-light"; // không cần polyfill process
import { useSocket } from "./SocketContext";

const CallManagerContext = createContext();
export const useCallManager = () => useContext(CallManagerContext);

export const CallManagerProvider = ({ children }) => {
  const socket = useSocket();
  const [callState, setCallState] = useState(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  // === Media Setup ===
  const setupMedia = async (callType) => {
    console.log("[CallManager] Requesting media for:", callType);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      streamRef.current = stream;
      console.log("[CallManager] Media stream obtained");
      return stream;
    } catch (err) {
      console.error("[CallManager] Media error:", err);
      throw err;
    }
  };

  // === Outgoing call ===
  const initiateCall = async ({
    conversationId,
    callerId,
    receiverId,
    callType,
  }) => {
    console.log("[CallManager] Initiating call:", {
      conversationId,
      callerId,
      receiverId,
      callType,
    });

    const stream = await setupMedia(callType);
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peerRef.current = peer;

    peer.on("signal", (offer) => {
      console.log("[CallManager] Sending offer to socket...");
      socket.emit("initiateCall", {
        conversationId,
        callerId,
        receiverId,
        callType,
        offer,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("[CallManager] Remote stream received (outgoing)");
      setCallState((prev) => {
        const newState = { ...prev, remoteStream };
        console.log(
          "[CallManager] callState updated (remoteStream):",
          newState
        );
        return newState;
      });
    });

    peer.on("error", (err) => {
      console.error("[CallManager] Peer error (outgoing):", err);
      endCall("error");
    });

    setCallState({
      status: "initiated",
      callType,
      callerId,
      receiverId,
      stream,
      peer,
    });
    console.log("[CallManager] callState set after initiateCall");
  };

  // === Incoming call ===
  const handleIncomingCall = async (callData) => {
    console.log("[CallManager] Incoming call received:", callData);
    const stream = await setupMedia(callData.callType);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peerRef.current = peer;

    peer.signal(callData.offer);

    peer.on("signal", (answer) => {
      console.log("[CallManager] Sending answer to socket...");
      socket.emit("answerCall", { callId: callData.callId, answer });
    });

    peer.on("stream", (remoteStream) => {
      console.log("[CallManager] Remote stream received (incoming)");
      setCallState((prev) => {
        const newState = { ...prev, remoteStream };
        console.log(
          "[CallManager] callState updated (remoteStream):",
          newState
        );
        return newState;
      });
    });

    peer.on("error", (err) => {
      console.error("[CallManager] Peer error (incoming):", err);
      endCall("error");
    });

    peer.on("icecandidate", (candidate) => {
      socket.emit("iceCandidate", {
        callId: callState.callId,
        candidate,
        toUserId:
          callState.callerId === userId
            ? callState.receiverId
            : callState.callerId,
      });
    });

    const newState = {
      ...callData,
      status: "ringing",
      stream,
      peer,
    };
    setCallState(newState);
    console.log(
      "[CallManager] callState set after handleIncomingCall:",
      newState
    );
  };

  const answerCall = () => {
    console.log("[CallManager] Answering call...");
    setCallState((prev) => {
      const newState = { ...prev, status: "answered" };
      console.log("[CallManager] callState after answer:", newState);
      // socket.emit("answerCall", { callId, answer: true });
      return newState;
    });
  };

  const endCall = (reason = "ended") => {
    if (callState?.status === "answered") {
      const minCallDuration = 1000; // 1 giây
      const callStartTime = callState.createdAt || Date.now();
      if (Date.now() - callStartTime < minCallDuration) {
        console.warn("[CallManager] Preventing premature call end");
        return;
      }
    }
    console.log("[CallManager] Ending call. Reason:", reason);
    socket.emit("endCall", { callId: callState?.callId, reason });
    cleanup();
  };

  const cleanup = () => {
    console.log("[CallManager] Cleaning up call resources...");
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCallState(null);
  };

  // === Socket listener ===
  useEffect(() => {
    if (!socket) {
      console.warn("[CallManager] Socket not initialized");
      return;
    }

    console.log("[CallManager] Registering socket listeners...");

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callStatus", (statusData) => {
      console.log("Call status updated:", statusData);
      // Cập nhật trạng thái UI (ringing, answered, ended)
    });
    socket.on("callAnswered", ({ answer }) => {
      console.log("[CallManager] Call answered by receiver, signaling peer...");
      peerRef.current?.signal(answer);
      setCallState((prev) => {
        const newState = { ...prev, status: "answered" };
        console.log("[CallManager] callState after callAnswered:", newState);
        return newState;
      });
    });
    socket.on("callEnded", ({ status }) => {
      console.log("[CallManager] Call ended. Status:", status);
      cleanup();
    });

    return () => {
      console.log("[CallManager] Cleaning up socket listeners");
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("callEnded");
    };
  }, [socket]);

  return (
    <CallManagerContext.Provider
      value={{
        callState,
        initiateCall,
        answerCall,
        endCall,
      }}
    >
      {children}
    </CallManagerContext.Provider>
  );
};
