import React, { useState, useEffect } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import {
  getChatLinks,
  deleteMessageChatInfo,
  forwardMessage,
  onChatLinks,
  offChatLinks,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";
import ShareModal from "../chat/ShareModal";

const GroupLinks = ({ conversationId, onDeleteLink, onForwardLink, userId, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkToForward, setLinkToForward] = useState(null);
  const [messageIdToForward, setMessageIdToForward] = useState(null);

  const fetchLinks = () => {
    if (!conversationId || !socket) {
      console.warn("conversationId hoặc socket không được cung cấp.");
      setLinks([]);
      return;
    }

    getChatLinks(socket, { conversationId }, (response) => {
      if (response && response.success) {
        const linkData = Array.isArray(response.data) ? response.data : [];
        console.log("[Socket.IO] Phản hồi (lấy link):", linkData);
        if (Array.isArray(linkData)) {
          const filteredLinks = linkData
            .filter((item) => item?.messageType === "link")
            .map((item) => ({
              id: item?._id || item?.id,
              title: item?.content || "Không có tiêu đề",
              url: item?.linkURL || "#",
              date: item?.createdAt?.split("T")[0] || "Không có ngày",
              sender: item?.userId || "Không rõ người gửi",
              messageId: item?._id,
              createdAt: item?.createdAt, // Lưu createdAt để sắp xếp
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp mới nhất trước
          setLinks(filteredLinks.slice(0, 3));
        } else {
          setLinks([]);
          console.error("Dữ liệu không hợp lệ:", response);
        }
      } else {
        setLinks([]);
        console.error("Lỗi khi lấy danh sách link:", response?.message);
      }
    });
  };

  useEffect(() => {
    if (!socket || !conversationId) return;

    onChatLinks(socket, (updatedLinks) => {
      console.log("[Socket.IO] Cập nhật danh sách link:", updatedLinks);
      if (Array.isArray(updatedLinks)) {
        const filteredLinks = updatedLinks
          .filter((item) => item?.messageType === "link")
          .map((item) => ({
            id: item?._id || item?.id,
            title: item?.content || "Không có tiêu đề",
            url: item?.linkURL || "#",
            date: item?.createdAt?.split("T")[0] || "Không có ngày",
            sender: item?.userId || "Không rõ người gửi",
            messageId: item?._id,
            createdAt: item?.createdAt,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp mới nhất trước
        setLinks(filteredLinks.slice(0, 3));
      } else {
        setLinks([]);
        console.warn("Dữ liệu cập nhật không hợp lệ:", updatedLinks);
      }
    });

    onError(socket, (error) => {
      console.error("[Socket.IO] Lỗi:", error.message);
    });

    fetchLinks();

    return () => {
      offChatLinks(socket);
      offError(socket);
    };
  }, [conversationId, socket]);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  const handleDeleteClick = (linkItem, event) => {
    event.stopPropagation();
    if (!linkItem?.id) {
      console.error("Không có id link để xóa.");
      return;
    }

    deleteMessage(socket, { messageId: linkItem.id }, (response) => {
      if (response && response.success) {
        console.log("Xóa link thành công:", response.data);
        if (onDeleteLink) {
          onDeleteLink(linkItem.id);
        }
        setLinks(links.filter((link) => link.id !== linkItem.id));
      } else {
        console.error("Lỗi khi xóa link:", response?.message);
      }
    });
  };

  const handleForwardClick = (linkItem, event) => {
    event.stopPropagation();
    setLinkToForward(linkItem);
    setMessageIdToForward(linkItem.messageId);
    setIsShareModalOpen(true);
    console.log("Yêu cầu chuyển tiếp link:", linkItem);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setLinkToForward(null);
    setMessageIdToForward(null);
  };

  const handleLinkShared = (targetConversations, shareContent) => {
    if (!linkToForward?.messageId) {
      console.error("Không có ID tin nhắn để chuyển tiếp link.");
      return;
    }
    if (!userId) {
      console.error("Không có ID người dùng để chuyển tiếp link.");
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn("Không có cuộc trò chuyện nào được chọn để chuyển tiếp link.");
      return;
    }

    forwardMessage(
      socket,
      {
        messageId: linkToForward.messageId,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      },
      (response) => {
        if (response && response.success) {
          console.log(`Đã chuyển tiếp link đến ${response.data.length} cuộc trò chuyện.`);
          setIsShareModalOpen(false);
          setLinkToForward(null);
          setMessageIdToForward(null);
          if (onForwardLink) {
            onForwardLink(linkToForward, targetConversations, shareContent);
          }
        } else {
          console.error("Lỗi khi chuyển tiếp link:", response?.message);
        }
      }
    );
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
                <FaTrash size={16} />
              </button>
              <button
                onClick={(event) => handleForwardClick(link, event)}
                className="text-gray-300 hover:text-blue-500"
                title="Chuyển tiếp"
              >
                <FaShare size={16} />
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
          socket={socket}
          userId={userId}
        />
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleLinkShared}
        userId={userId}
        messageId={messageIdToForward}
        messageToForward={linkToForward}
      />
    </div>
  );
};

export default GroupLinks;