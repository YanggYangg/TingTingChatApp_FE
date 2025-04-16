import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupMediaGallery = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState([]);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const videoRef = useRef(null);

  // Hàm lấy lại dữ liệu media từ API
  const fetchMedia = async () => {
    try {
      console.log("Đang lấy dữ liệu từ API...");
      const response = await Api_chatInfo.getChatMedia(conversationId);
      console.log("Dữ liệu API nhận được:", response);

      const mediaData = Array.isArray(response?.data) ? response.data : response;

      if (Array.isArray(mediaData)) {
        const filteredMedia = mediaData.map((item) => ({
          src: item?.linkURL || "#",
          name: item?.content || "Không có tên",
          type: item?.messageType || "image",
        }));
        setMedia(filteredMedia);
      } else {
        console.warn("API không trả về dữ liệu hợp lệ.");
        setMedia([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu media:", error);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    fetchMedia();
  }, [conversationId]);

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi tải file (CORS hoặc khác):", error);
      alert("Fetch bị chặn, thử tải trực tiếp!");
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;
      fallbackLink.download = filename;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  useEffect(() => {
    if (fullScreenMedia && fullScreenMedia.type === "video" && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Lỗi khi phát video:", error);
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [fullScreenMedia]);

  return (
    <div>
      {/* Gallery chính */}
      <div className="flex-1">
        <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
        <div className="grid grid-cols-4 gap-2">
          {media.slice(0, 8).map((item, index) => (
            <div key={index} className="relative">
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-20 h-20 rounded-md object-cover cursor-pointer transition-all hover:scale-105"
                  onClick={() => setFullScreenMedia(item)}
                />
              ) : (
                <video
                  src={item.src}
                  className="w-20 h-20 rounded-md object-cover cursor-pointer transition-all hover:scale-105"
                  onClick={() => setFullScreenMedia(item)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Open Storage Page */}
        <button
          className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(true)}
        >
          Xem tất cả
        </button>
        {isOpen && (
          <StoragePage
            conversationId={conversationId}
            onClose={() => setIsOpen(false)}
            onDelete={fetchMedia} // Truyền callback để gọi lại API sau khi xóa
          />
        )}
      </div>

      {/* Modal hiển thị media toàn màn hình */}
      {fullScreenMedia && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative flex bg-white rounded-lg shadow-lg">
            <div className="relative flex items-center justify-center w-[60vw] h-[90vh] p-4">
              {fullScreenMedia.type === "image" ? (
                <img
                  src={fullScreenMedia.src}
                  alt={fullScreenMedia.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg transition-all"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={fullScreenMedia.src}
                  controls
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg transition-all"
                />
              )}
              <button
                className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                onClick={() => setFullScreenMedia(null)}
              >
                ✖
              </button>
              <button
                onClick={() => downloadImage(fullScreenMedia.src, fullScreenMedia.name)}
                className="absolute bottom-2 right-2 bg-white px-4 py-2 rounded text-sm text-gray-800 hover:bg-gray-200 transition-all"
              >
                ⬇ Tải xuống
              </button>
            </div>
            <div className="w-40 h-[90vh] bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {media.map((item, index) => (
                <div key={index}>
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={item.name}
                      className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                        fullScreenMedia.src === item.src
                          ? "opacity-100 border-2 border-blue-400"
                          : "opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setFullScreenMedia(item)}
                    />
                  ) : (
                    <video
                      src={item.src}
                      className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                        fullScreenMedia.src === item.src
                          ? "opacity-100 border-2 border-blue-400"
                          : "opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setFullScreenMedia(item)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMediaGallery;