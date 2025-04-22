import React, { useRef, useEffect, useState } from "react";
import { useCallManager } from "../../contexts/CallManagerContext";

const CallModal = () => {
  const { callState, answerCall, endCall } = useCallManager();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    console.log("[CallModal] callState updated:", callState);
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
  }, [callState]);

  useEffect(() => {
    if (localVideoRef.current && callState?.stream) {
      localVideoRef.current.srcObject = callState.stream;
    }
    if (
      remoteVideoRef.current &&
      callState?.remoteStream &&
      callState?.status === "answered"
    ) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState?.stream, callState?.remoteStream, callState?.status]);

  // Tính và hiển thị thời gian cuộc gọi
  useEffect(() => {
    let timer;
    if (callState?.status === "answered") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState?.status]);

  useEffect(() => {
    if (callState?.duration) {
      setCallDuration(callState.duration);
    }
  }, [callState?.duration]);

  if (!callState) {
    console.log("[CallModal] callState is null, not rendering modal");
    return null;
  }

  const { status, callType } = callState;

  // Format thời gian thành mm:ss
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl z-100">
        <div className="flex flex-col items-center">
          <img
            src="https://chiemtaimobile.vn/images/companies/1/%E1%BA%A2nh%20Blog/avatar-facebook-dep/Anh-avatar-hoat-hinh-de-thuong-xinh-xan.jpg?1704788263223"
            alt="Avatar"
            className="w-24 h-24 rounded-full mb-4 shadow-md object-cover"
          />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {status === "initiated" && "Đang gọi..."}
            {status === "ringing" && "Có cuộc gọi đến"}
            {status === "answered" && "Đang trò chuyện"}
          </h2>
          {status === "answered" && (
            <div className="text-sm text-gray-500 mb-2">
              Thời gian: {formatDuration(callDuration)}
            </div>
          )}

          {callType === "voice" && (
            <div className="mb-4">
              <audio ref={localVideoRef} autoPlay muted />
              {status === "answered" && <audio ref={remoteVideoRef} autoPlay />}
              <div className="text-sm text-gray-500 mt-2">Cuộc gọi thoại</div>
            </div>
          )}

          {callType === "video" && (
            <div className="flex flex-col items-center mb-4">
              {status === "answered" && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-64 h-64 rounded-xl border border-gray-300 mb-2 shadow-lg"
                />
              )}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-24 h-24 rounded-xl border border-gray-200 shadow-sm"
              />
              <div className="text-sm text-gray-500 mt-2">Cuộc gọi video</div>
            </div>
          )}

          <div className="flex space-x-4 mt-4">
            {status === "ringing" && (
              <button
                onClick={answerCall}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-semibold shadow"
              >
                Trả lời
              </button>
            )}
            {(status === "ringing" ||
              status === "initiated" ||
              status === "answered") && (
              <button
                onClick={() => endCall()}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full font-semibold shadow"
              >
                Kết thúc
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
