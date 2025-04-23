import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import Peer from "simple-peer-light";
import { useSocket } from "./SocketContext";

const CallManagerContext = createContext();
export const useCallManager = () => useContext(CallManagerContext);

export const CallManagerProvider = ({ children, userId1 }) => {
  const { socket, userId } = useSocket();
  const [callState, setCallState] = useState(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);

  // === Media Setup ===
  const setupMedia = async (callType) => {
    console.log("[CallManager] Requesting media for:", callType);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      streamRef.current = stream;
      console.log(
        "[CallManager] Media stream obtained:",
        stream.getVideoTracks()
      );
      return stream;
    } catch (err) {
      console.error("[CallManager] Media error:", err.name, err.message);
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

    try {
      const stream = await setupMedia(callType);
      const peer = new Peer({ initiator: true, trickle: false, stream });
      peerRef.current = peer;

      peer.on("signal", (offer) => {
        console.log("[CallManager] Sending offer to socket:", offer);
        socket.emit("initiateCall", {
          conversationId,
          callerId,
          receiverId,
          callType,
          offer,
        });
      });

      peer.on("stream", (remoteStream) => {
        console.log(
          "[CallManager] Remote stream received (outgoing):",
          remoteStream.getVideoTracks()
        );
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
    } catch (err) {
      console.error("[CallManager] Failed to initiate call:", err);
      endCall("media_error");
    }
  };

  // === Incoming call ===
  const handleIncomingCall = async (callData) => {
    console.log("[CallManager] Incoming call received:", callData);
    try {
      // Lưu callId vào callState trước để đảm bảo endCall có callId
      setCallState({
        callId: callData.callId,
        status: "ringing",
        callType: callData.callType,
        callerId: callData.callerId,
        receiverId: callData.receiverId,
        offer: callData.offer,
      });

      const stream = await setupMedia(callData.callType);
      const peer = new Peer({ initiator: false, trickle: false, stream });
      peerRef.current = peer;

      peer.on("signal", (answer) => {
        console.log("[CallManager] Sending answer to socket...");
        socket.emit("answerCall", { callId: callData.callId, answer });
      });

      peer.on("stream", (remoteStream) => {
        console.log(
          "[CallManager] Remote stream received (incoming):",
          remoteStream.getVideoTracks()
        );
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
          callId: callData.callId,
          candidate,
          toUserId:
            callData.callerId === userId1
              ? callData.receiverId
              : callData.callerId,
        });
      });

      // Cập nhật callState với stream và peer
      setCallState((prev) => {
        const newState = {
          ...prev,
          stream,
          peer,
        };
        console.log(
          "[CallManager] callState set after handleIncomingCall:",
          newState
        );
        return newState;
      });

      timeoutRef.current = setTimeout(() => {
        console.warn("[CallManager] Call timeout, forcing end");
        endCall("timeout");
      }, 60000);
    } catch (err) {
      console.error("[CallManager] Failed to handle incoming call:", err);
      socket.emit("endCall", {
        callId: callData.callId,
        reason: "media_error",
      });
      cleanup();
    }
  };

  const answerCall = () => {
    console.log("[CallManager] Answering call...");
    if (peerRef.current && callState?.offer) {
      peerRef.current.signal(callState.offer);
    }
    setCallState((prev) => {
      const newState = { ...prev, status: "answered" };
      console.log("[CallManager] callState after answer:", newState);
      return newState;
    });
  };

  const endCall = (reason = "ended") => {
    console.log(
      "[CallManager] Ending call. Reason:",
      reason,
      "Call ID:",
      callState?.callId
    );
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (callState?.callId) {
      socket.emit("endCall", { callId: callState.callId, reason });
    } else {
      console.warn("[CallManager] No callId available to end call");
    }
    cleanup();
  };

  const cleanup = () => {
    console.log("[CallManager] Cleaning up call resources...");
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCallState(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // === Socket listener ===
  useEffect(() => {
    if (!socket) {
      console.warn("[CallManager] Socket not initialized");
      return;
    }

    console.log(
      "[CallManager] Registering socket listeners for userId1:",
      userId1
    );
    const handleConnectError = (err) => {
      console.error("[CallManager] Socket connection error:", err);
    };

    socket.on("connect_error", handleConnectError);
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callStatus", (statusData) => {
      console.log("[CallManager] Call status updated:", statusData);
      setCallState((prev) => {
        if (prev && statusData.callId) {
          const newState = {
            ...prev,
            callId: statusData.callId,
            duration: statusData.duration || prev?.duration,
          };
          console.log(
            "[CallManager] callState updated with callId and duration:",
            newState
          );
          return newState;
        }
        return prev;
      });
    });
    socket.on("callAnswered", ({ answer, callId }) => {
      console.log("[CallManager] Call answered by receiver, signaling peer...");
      peerRef.current?.signal(answer);
      setCallState((prev) => {
        const newState = {
          ...prev,
          status: "answered",
          callId: callId || prev?.callId,
        };
        console.log("[CallManager] callState after callAnswered:", newState);
        return newState;
      });
    });
    socket.on("callEnded", ({ status, callId, duration }) => {
      console.log(
        "[CallManager] Call ended received. Status:",
        status,
        "Call ID:",
        callId,
        "Duration:",
        duration
      );
      console.log("[CallManager] Current callState:", callState);
      if (callState) {
        console.log("[CallManager] Cleaning up due to callEnded event");
        setCallState((prev) => (prev ? { ...prev, duration } : null));
        cleanup();
      } else {
        console.warn("[CallManager] No active callState to clean up");
      }
    });

    return () => {
      console.log("[CallManager] Cleaning up socket listeners");
      socket.off("connect_error", handleConnectError);
      socket.off("incomingCall");
      socket.off("callStatus");
      socket.off("callAnswered");
      socket.off("callEnded");
    };
  }, [socket, callState, userId1]);

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
