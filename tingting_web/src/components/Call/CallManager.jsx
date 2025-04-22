import React, { useEffect, useState } from "react";
import { useCall } from "../../contexts/CallContext";
import { useSocket } from "../../contexts/SocketContext";
import CallModal from "./CallModal";

const CallManager = () => {
  const { incomingCall, clearIncomingCall } = useCall();
  const socket = useSocket();
  const currentUserId = localStorage.getItem("userId");
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    console.log("CallManager: Initializing with userId", currentUserId);
    console.log("CallManager: Socket status", {
      socket: !!socket,
      connected: socket?.connected,
      socketId: socket?.id,
    });
    if (!socket) {
      setIsSocketReady(false);
      console.warn("CallManager: Socket not available");
      return;
    }
    if (socket.connected) {
      setIsSocketReady(true);
      console.log("CallManager: Socket connected", { socketId: socket.id });
    } else {
      console.warn("CallManager: Socket not connected, waiting for connection");
      socket.on("connect", () => {
        console.log("CallManager: Socket connected", { socketId: socket.id });
        setIsSocketReady(true);
      });
    }
    return () => {
      socket?.off("connect");
    };
  }, [socket, currentUserId]);

  useEffect(() => {
    console.log("CallManager: Incoming call status", { incomingCall });
  }, [incomingCall]);

  if (!currentUserId) {
    console.warn("CallManager: No currentUserId, cannot process incoming call");
    return null;
  }

  if (!isSocketReady) {
    console.warn("CallManager: Socket not available or not connected");
    return null;
  }

  if (!incomingCall) {
    console.log("CallManager: No incoming call");
    return null;
  }

  if (incomingCall.receiverId !== currentUserId) {
    console.log("CallManager: Ignoring incoming call for different user", {
      currentUserId,
      receiverId: incomingCall.receiverId,
    });
    return null;
  }

  console.log(
    "CallManager: Rendering CallModal for incoming call",
    incomingCall
  );

  return (
    <CallModal
      key={`${incomingCall.conversationId}-${incomingCall.callType}-receiver`}
      conversationId={incomingCall.conversationId}
      userId={incomingCall.receiverId}
      receiverId={incomingCall.callerId}
      callType={incomingCall.callType}
      onClose={clearIncomingCall}
      isCaller={false}
    />
  );
};

export default CallManager;
