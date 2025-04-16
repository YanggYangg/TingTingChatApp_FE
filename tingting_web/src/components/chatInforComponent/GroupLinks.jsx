import React, { useState, useEffect } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { FaTrash, FaShare } from "react-icons/fa"; // Import icon xóa và chuyển tiếp giống GroupFile
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupLinks = ({ conversationId, onDeleteLink, onForwardLink }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  // Hàm lấy lại danh sách link từ API
  const fetchLinks = async () => {
    try {
      const response = await Api_chatInfo.getChatLinks(conversationId);
      const linkData = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(linkData)) {
        const filteredLinks = linkData
          .filter((item) => item?.messageType === "link")
          .map((item) => ({
            id: item?._id || item?.id, // Đảm bảo có ID
            title: item?.content || "Không có tiêu đề",
            url: item?.linkURL || "#",
            date: item?.createdAt?.split("T")[0] || "Không có ngày",
            sender: item?.userId || "Không rõ người gửi",
            messageId: item?.messageId, // Lấy messageId để xóa
          }));

        const sortedLinks = filteredLinks.sort((a, b) => {
          if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
          } else {
            return 0;
          }
        });

        setLinks(sortedLinks.slice(0, 3));
      } else {
        setLinks([]);
        console.error("Dữ liệu không hợp lệ:", response);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách link:", error);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    fetchLinks();
  }, [conversationId]);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  const handleDeleteClick = async (linkItem, event) => {
    event.stopPropagation();
    if (!linkItem?.messageId) {
      console.error("Không có messageId link để xóa.");
      return;
    }

    try {
      const response = await Api_chatInfo.deleteMessage([linkItem.messageId]); // Truyền mảng messageIds
      console.log('[DELETE] Phản hồi API (xóa link):', response);

      if (response?.message) {
        console.log("Xóa link thành công:", response.message);
        // Gọi callback để thông báo link đã xóa và cập nhật lại danh sách link
        if (onDeleteLink) {
          onDeleteLink(linkItem.messageId);
        }
        fetchLinks(); // Gọi lại để cập nhật danh sách link sau khi xóa
      } else {
        console.error('[DELETE] Phản hồi API không mong đợi:', response);
      }
    } catch (error) {
      console.error('Lỗi khi xóa liên kết:', error);
    }
  };

  const handleForwardClick = (linkItem, event) => {
    event.stopPropagation();
    if (onForwardLink && linkItem) {
      console.log("Chuyển tiếp link:", linkItem);
      onForwardLink(linkItem);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Liên kết</h3>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className="relative group bg-gray-100 p-2 rounded-md"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div>
              <p className="text-sm font-semibold truncate">{link.title}</p>
              <a
                href={link.url}
                className="text-blue-500 text-xs truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.url}
              </a>
            </div>
            <div
              className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
            >
              <button
                onClick={(event) => handleDeleteClick(link, event)}
                className="text-gray-300 hover:text-red-500"
                title="Xóa"
              >
                <FaTrash size={16} /> {/* Sử dụng FaTrash */}
              </button>
              <button
                onClick={(event) => handleForwardClick(link, event)}
                className="text-gray-300 hover:text-blue-500"
                title="Chuyển tiếp"
              >
                <FaShare size={16} /> {/* Sử dụng FaShare */}
              </button>
              <a
                href={link.url}
                className="text-gray-300 hover:text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                title="Mở liên kết"
              >
                <AiOutlineLink size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          links={links}
          onClose={() => setIsOpen(false)}
          onDelete={fetchLinks}
        />
      )}
    </div>
  );
};

export default GroupLinks;