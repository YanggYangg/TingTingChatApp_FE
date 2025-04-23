"use client";

import { useRef, useEffect, useState } from "react";
import { useCallManager } from "../../contexts/CallManagerContext";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { Api_Profile } from "../../../apis/api_profile";

const CallModal = () => {
  const { callState, answerCall, endCall } = useCallManager();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [avatar, setAvatar] = useState("");

  console.log("Call", callState);
  console.log("receiver", callState?.receiverId);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!callState?.receiverId) {
        console.log("None receiverId");
        return;
      }

      try {
        const userResponse = await Api_Profile.getProfile(
          callState?.receiverId
        );
        setFirstname(userResponse?.data?.user?.firstname);
        setSurname(userResponse?.data?.user?.surname);
        setAvatar(userResponse?.data?.user?.avatar);
      } catch (err) {
        console.log("Lỗi khi lấy thông tin người nhận:", err);
      }
    };

    fetchProfile();
  }, [callState?.receiverId]);

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

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (status) {
      case "initiated":
        return "Đang gọi...";
      case "ringing":
        return "Có cuộc gọi đến";
      case "answered":
        return "Đang trò chuyện";

      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/50 ">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl z-100 border border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex flex-col items-center">
          {/* Avatar with pulsing animation when ringing */}
          <div
            className={`relative mb-6 ${
              status === "ringing" ? "animate-pulse" : ""
            }`}
          >
            <div
              className={`absolute -inset-1 rounded-full ${
                status === "ringing" ? "bg-green-400/30" : "bg-blue-400/20"
              }`}
            />
            <img
              src={avatar || "https://picsum.photos/200"}
              alt="Avatar"
              className="w-28 h-28 rounded-full shadow-lg object-cover border-4 border-white dark:border-gray-800 relative"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {firstname + " " + surname}
          </h2>

          {/* Status text */}
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {getStatusText()}
          </h2>

          {/* Call duration */}
          {status === "answered" && (
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Call type indicator */}
          <div className="flex items-center gap-2 mb-6">
            {callType === "video" ? (
              <Video className="h-4 w-4 text-blue-500" />
            ) : (
              <Mic className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
            </span>
          </div>

          {/* Video elements */}
          {callType === "voice" && (
            <div className="mb-6 w-full">
              <audio ref={localVideoRef} autoPlay muted />
              {status === "answered" && <audio ref={remoteVideoRef} autoPlay />}
            </div>
          )}

          {callType === "video" && (
            <div className="relative w-full mb-8">
              {status === "answered" && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-full aspect-video rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg object-cover bg-gray-100 dark:bg-gray-800"
                />
              )}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className={`rounded-2xl border-2 border-white dark:border-gray-700 shadow-lg object-cover bg-gray-100 dark:bg-gray-800 ${
                  status === "answered"
                    ? "absolute bottom-4 right-4 w-1/3 aspect-video"
                    : "w-full aspect-video"
                }`}
              />
            </div>
          )}

          {/* Call controls */}
          <div className="flex justify-center gap-6 mt-2">
            {status === "ringing" && (
              <button
                onClick={answerCall}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Trả lời"
              >
                <Phone className="h-6 w-6" />
              </button>
            )}

            {(status === "ringing" ||
              status === "initiated" ||
              status === "answered") && (
              <button
                onClick={() => endCall()}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Kết thúc"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Call action labels */}
          <div className="flex justify-center gap-6 mt-2">
            {status === "ringing" && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-14 text-center">
                Trả lời
              </span>
            )}

            {(status === "ringing" ||
              status === "initiated" ||
              status === "answered") && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-14 text-center">
                Kết thúc
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
