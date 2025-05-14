import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { IoArrowRedoOutline, IoTrashOutline } from "react-icons/io5";
import StoragePage from "./StoragePage";
import ShareModal from "../../components/chat/ShareModal";
import {
  getChatMedia,
  forwardMessage,
  onChatMedia,
  offChatMedia,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";

const GroupMediaGallery = ({ conversationId, onForward, userId, socket }) => {
  const [media, setMedia] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mediaToForward, setMediaToForward] = useState(null);
  const [messageIdToForward, setMessageIdToForward] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const videoRef = useRef(null);

  const fetchMedia = () => {
    if (!conversationId || !socket) {
      console.warn("conversationId hoặc socket không được cung cấp.");
      setMedia([]);
      setError("Thiếu thông tin để tải media.");
      return;
    }

    getChatMedia(socket, { conversationId }, (response) => {
      if (response && response.success) {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        console.log("[Socket.IO] Phản hồi (lấy media):", mediaData);
        const filteredMedia = mediaData
          .flatMap((item) => {
            const urls = Array.isArray(item?.linkURL)
              ? item.linkURL.filter((url) => url && typeof url === "string")
              : typeof item?.linkURL === "string"
              ? [item.linkURL]
              : [];
            if (urls.length === 0) {
              console.warn(`Tin nhắn ${item._id} thiếu linkURL:`, item);
              return [];
            }
            return urls.map((url, urlIndex) => ({
              id: `${item?._id}_${urlIndex}`,
              messageId: item?._id,
              src: url,
              name: item?.content || `Media_${urlIndex + 1}`,
              type: item?.messageType || "image",
              urlIndex,
            }));
          })
          .filter((mediaItem) => mediaItem.src);
        setMedia(filteredMedia.length ? filteredMedia : []);
        // setError(filteredMedia.length ? null : "Không có ảnh nào.");
      } else {
        setMedia([]);
        setError("Lỗi khi tải media. Vui lòng thử lại.");
        console.error("Lỗi khi lấy media:", response?.message);
      }
    });
  };

  useEffect(() => {
    if (!socket || !conversationId) return;

    onChatMedia(socket, (updatedMedia) => {
      console.log("[Socket.IO] Cập nhật danh sách media:", updatedMedia);
      if (Array.isArray(updatedMedia)) {
        const filteredMedia = updatedMedia
          .flatMap((item) => {
            const urls = Array.isArray(item?.linkURL)
              ? item.linkURL.filter((url) => url && typeof url === "string")
              : typeof item?.linkURL === "string"
              ? [item.linkURL]
              : [];
            if (urls.length === 0) {
              console.warn(`Tin nhắn ${item._id} thiếu linkURL:`, item);
              return [];
            }
            return urls.map((url, urlIndex) => ({
              id: `${item?._id}_${urlIndex}`,
              messageId: item?._id,
              src: url,
              name: item?.content || `Media_${urlIndex + 1}`,
              type: item?.messageType || "image",
              urlIndex,
            }));
          })
          .filter((mediaItem) => mediaItem.src);
        setMedia(filteredMedia.length ? filteredMedia : []);
        // setError(filteredMedia.length ? null : "Không có ảnh nào.");
      } else {
        setMedia([]);
        setError("Dữ liệu cập nhật không hợp lệ.");
        console.warn("Dữ liệu cập nhật không hợp lệ:", updatedMedia);
      }
    });

    onError(socket, (error) => {
      console.error("[Socket.IO] Lỗi:", error.message);
      setError(error.message || "Lỗi khi tải media. Vui lòng thử lại.");
    });

    socket.on("deleteAllChatHistory", (data) => {
      console.log("GroupMediaGallery: Nhận sự kiện deleteAllChatHistory:", data);
      if (data.conversationId === conversationId) {
        console.log("GroupMediaGallery: Xóa media do lịch sử trò chuyện bị xóa");
        setMedia([]);
        setError("Lịch sử trò chuyện đã bị xóa.");
      }
    });

    fetchMedia();

    return () => {
      offChatMedia(socket);
      offError(socket);
      socket.off("deleteAllChatHistory");
    };
  }, [conversationId, socket]);

  const handleDeleteFromStorage = (deletedItems) => {
    console.log("Cập nhật media sau khi xóa:", deletedItems);
    const newMedia = media.filter((mediaItem) => {
      const isDeleted = deletedItems.some(
        (item) =>
          item.messageId === mediaItem.messageId && item.urlIndex === mediaItem.urlIndex
      );
      return !isDeleted;
    });

    if (newMedia.length !== media.length) {
      setMedia(newMedia);

    } else {
      console.warn("Không thể cập nhật cục bộ, tải lại media...");
      fetchMedia();
    }
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleForwardClick = (item, event) => {
    event.stopPropagation();
    setMediaToForward(item);
    setMessageIdToForward(item.messageId);
    setIsShareModalOpen(true);
  };

  const handleMediaShared = (targetConversations, shareContent) => {
    if (!mediaToForward?.messageId) {
      console.error("Không có ID tin nhắn để chuyển tiếp.");
      return;
    }
    if (!userId) {
      console.error("Không có ID người dùng để chuyển tiếp.");
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn("Không có cuộc trò chuyện nào được chọn để chuyển tiếp.");
      return;
    }

    forwardMessage(
      socket,
      {
        messageId: mediaToForward.messageId,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      },
      (response) => {
        if (response && response.success) {
          console.log(`Đã chuyển tiếp media đến ${response.data.length} cuộc trò chuyện.`);
          setIsShareModalOpen(false);
          setMediaToForward(null);
          setMessageIdToForward(null);
          if (onForward) {
            onForward(mediaToForward, targetConversations, shareContent);
          }
        } else {
          console.error("Lỗi khi chuyển tiếp media:", response?.message);
        }
      }
    );
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setMediaToForward(null);
    setMessageIdToForward(null);
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
    if (fullScreenMedia && fullScreenMedia.type === "video" && videoRef.current) {
      videoRef.current.play().catch((error) => console.error("Lỗi khi phát video:", error));
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
          <p className="text-gray-500 text-sm">Không có media nào.</p>
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
                <div
                  className={`absolute top-0 right-0 p-1 flex flex-col items-end rounded-tl-md bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1`}
                >
                  <button
                    onClick={(event) => handleForwardClick(item, event)}
                    className="p-1 rounded-full bg-white text-blue-500 hover:bg-blue-100 transition-colors shadow-sm"
                    title="Chuyển tiếp"
                  >
                    <IoArrowRedoOutline size={16} />
                  </button>
                </div>
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
          <StoragePage
            conversationId={conversationId}
            onClose={() => setIsOpen(false)}
            onDelete={handleDeleteFromStorage}
            socket={socket}
          />
        )}
      </div>

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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleMediaShared}
        userId={userId}
        messageId={messageIdToForward}
        messageToForward={mediaToForward}
      />
    </div>
  );
};

export default GroupMediaGallery;