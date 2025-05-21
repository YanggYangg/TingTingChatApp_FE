import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { IoArrowRedoOutline, IoTrashOutline } from "react-icons/io5";
import StoragePageCloud from "./StoragePageCloud";
import axios from "axios";

const GroupMediaGalleryCloud = ({
  conversationId,
  onForward,
  userId,
  cloudMessages,
}) => {
  const [media, setMedia] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!conversationId || conversationId !== "my-cloud" || !cloudMessages)
      return;

    const mediaMessages = cloudMessages
      .filter((msg) =>
        msg.fileUrls?.some((url) => /\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(url))
      )
      .map((msg) => ({
        id: msg.messageId,
        messageId: msg.messageId,
        urlIndex: 0,
        src: msg.fileUrls?.[0] || msg.thumbnailUrls?.[0] || "",
        name: msg.filenames?.[0] || msg.content || "Không có tên",
        type: /\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrls?.[0])
          ? "image"
          : "video",
      }));
    setMedia(mediaMessages);
    setError(mediaMessages.length ? null : "Không có ảnh hoặc video nào.");
  }, [conversationId, cloudMessages]);

  const handleDeleteFromStorage = (deletedItems) => {
    const newMedia = media.filter(
      (mediaItem) =>
        !deletedItems.some((item) => item.messageId === mediaItem.messageId)
    );
    setMedia(newMedia);
    setError(newMedia.length ? null : "Không có ảnh hoặc video nào.");
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

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
    if (
      fullScreenMedia &&
      fullScreenMedia.type === "video" &&
      videoRef.current
    ) {
      videoRef.current
        .play()
        .catch((error) => console.error("Lỗi khi phát video:", error));
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [fullScreenMedia]);

  return (
    <div>
      <div className="flex-1">
        <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : media.length === 0 ? (
          <p className="text-gray-500 text-sm">Không có media để hiển thị.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {media.slice(0, 8).map((item, index) => (
              <div
                key={item.id}
                className="relative group cursor-pointer"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => setFullScreenMedia(item)}
              >
                {item.type === "image" ? (
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-20 h-20 rounded-md object-cover transition-all hover:scale-105"
                  />
                ) : (
                  <video
                    src={item.src}
                    className="w-20 h-20 rounded-md object-cover transition-all hover:scale-105"
                  />
                )}
                {hoveredIndex === index && (
                  <div className="absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md space-x-1">
                    <button
                      className="text-gray-300 hover:text-red-500"
                      title="Xóa"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await axios.delete(
                            `http://184.73.0.29:3000/api/messages/${item.messageId}`
                          );
                          setMedia(media.filter((m) => m.id !== item.id));
                        } catch (error) {
                          console.error("Lỗi khi xóa media:", error);
                        }
                      }}
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(true)}
        >
          Xem tất cả
        </button>
        {isOpen && (
          <StoragePageCloud
            conversationId={conversationId}
            onClose={() => setIsOpen(false)}
            onDelete={handleDeleteFromStorage}
            userId={userId}
            cloudMessages={cloudMessages}
            initialTab="images" // Đặt tab mặc định khi mở từ GroupMediaGalleryCloud
          />
        )}
      </div>

      {fullScreenMedia && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[1000]">
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
            </div>
            <div className="w-40 h-[90vh] bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {media.map((item) => (
                <div key={item.id}>
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={item.name}
                      className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                        fullScreenMedia?.src === item.src
                          ? "opacity-100 border-2 border-blue-400"
                          : "opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => setFullScreenMedia(item)}
                    />
                  ) : (
                    <video
                      src={item.src}
                      className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                        fullScreenMedia?.src === item.src
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

export default GroupMediaGalleryCloud;
