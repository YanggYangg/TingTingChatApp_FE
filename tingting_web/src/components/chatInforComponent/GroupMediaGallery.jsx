import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { IoTrashOutline, IoArrowRedoOutline } from "react-icons/io5"; // Import các icon

const GroupMediaGallery = ({ conversationId, onDelete, onForward }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [media, setMedia] = useState([]);
    const [fullScreenMedia, setFullScreenMedia] = useState(null);
    const videoRef = useRef(null);
    const [hoveredIndex, setHoveredIndex] = useState(-1); // Theo dõi item đang hover

    // Hàm lấy lại dữ liệu media từ API
    const fetchMedia = async () => {
        try {
            console.log("Đang lấy dữ liệu từ API...");
            const response = await Api_chatInfo.getChatMedia(conversationId);
            console.log("Dữ liệu API nhận được:", response);

            const mediaData = Array.isArray(response?.data) ? response.data : response;

            if (Array.isArray(mediaData)) {
                const filteredMedia = mediaData.map((item) => ({
                    id: item?._id || item?.id, // Đảm bảo có ID để xóa/chuyển tiếp
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

    const handleMouseEnter = (index) => {
      setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
      setHoveredIndex(-1);
  };

  const handleDeleteClick = (mediaItem, event) => {
      event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài (mở full màn hình)
      if (onDelete && mediaItem.id) {
          console.log("Xóa media:", mediaItem.id);
          onDelete(mediaItem.id);
      }
  };

  const handleForwardClick = (mediaItem, event) => {
      event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài (mở full màn hình)
      if (onForward && mediaItem) {
          console.log("Chuyển tiếp media:", mediaItem);
          onForward(mediaItem);
      }
  };

  return (
      <div>
          {/* Gallery chính */}
          <div className="flex-1">
              <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
              <div className="grid grid-cols-4 gap-2">
                  {media.slice(0, 8).map((item, index) => (
                      <div
                          key={index}
                          className="relative group cursor-pointer" // Thêm cursor-pointer cho cả div
                          onMouseEnter={() => handleMouseEnter(index)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => setFullScreenMedia(item)} // Sự kiện click cho toàn bộ div
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
                          {/* Các nút action ở góc trên bên phải */}
                          <div
                              className={`absolute top-0 right-0 p-1 flex flex-col items-end rounded-tl-md bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1`}
                          >
                              <button
                                  onClick={(event) => handleDeleteClick(item, event)}
                                  className="p-1 rounded-full bg-white text-red-500 hover:bg-red-100 transition-colors shadow-sm"
                                  title="Xóa"
                              >
                                  <IoTrashOutline size={16} />
                              </button>
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
                      onDelete={fetchMedia}
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

export default GroupMediaGallery;