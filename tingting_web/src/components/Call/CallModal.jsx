import React, { useRef, useEffect } from "react";
import { useCallManager } from "../../contexts/CallManagerContext";

const CallModal = () => {
  const { callState, answerCall, endCall } = useCallManager();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (callState?.status === "ringing") {
      const audio = new Audio(
        "/bac-bling-bac-ninh-ns-xuan-hinh-tuan-cry-rap.mp3"
      );
      audio.loop = true;
      audio.play();
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [callState?.status]);

  useEffect(() => {
    if (localVideoRef.current && callState?.stream) {
      localVideoRef.current.srcObject = callState.stream;
    }
    if (remoteVideoRef.current && callState?.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState?.stream, callState?.remoteStream]);

  if (!callState) return null;

  const { status, callType } = callState;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {status === "initiated" && "Đang gọi..."}
          {status === "ringing" && "Có cuộc gọi đến..."}
          {status === "answered" && "Đang trò chuyện"}
        </h2>
        <div className="flex flex-col items-center">
          {callType === "voice" && (
            <>
              <audio ref={localVideoRef} autoPlay muted />
              <audio ref={remoteVideoRef} autoPlay />
            </>
          )}
          {callType === "video" && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-32 h-32 rounded mb-2"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-64 h-64 rounded mb-2"
              />
            </>
          )}
          {status === "ringing" && (
            <button
              onClick={answerCall}
              className="bg-green-500 text-white px-4 py-2 rounded mb-2"
            >
              Trả lời
            </button>
          )}
          {(status === "ringing" ||
            status === "initiated" ||
            status === "answered") && (
            <button
              onClick={() => endCall()}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Kết thúc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
