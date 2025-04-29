import React, { useState, useEffect, useMemo } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import ShareModal from "../chat/ShareModal";
import { initSocket } from "../../../../socket";

const GroupLinks = ({ conversationId, onDeleteLink, onForwardLink, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkToForward, setLinkToForward] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const newSocket = initSocket(userId);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const fetchLinks = async () => {
    if (!conversationId) return;

    try {
      const response = await Api_chatInfo.getChatLinks(conversationId);
      const linkData = Array.isArray(response) ? response : response?.data || [];
      const formattedLinks = linkData
        .filter((item) => item?.messageType === "link")
        .map((item) => ({
          id: item?._id,
          title: item?.content || "Không có tiêu đề",
          url: item?.linkURL || "#",
          date: item?.createdAt?.split("T")[0] || "Không có ngày",
          sender: item?.userId || "Không rõ người gửi",
          messageId: item?._id,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setLinks(formattedLinks.slice(0, 3));
    } catch (error) {
      console.error("Lỗi khi lấy link:", error);
      setLinks([]);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on("receiveMessage", (message) => {
      if (message.conversationId !== conversationId || message.messageType !== "link") return;

      const newLink = {
        id: message._id,
        title: message.content || "Không có tiêu đề",
        url: message.linkURL || "#",
        date: message.createdAt?.split("T")[0] || "Không có ngày",
        sender: message.userId || "Không rõ người gửi",
        messageId: message._id,
      };

      setLinks((prev) => [newLink, ...prev].slice(0, 3));
    });

    socket.on("messageDeleted", (data) => {
      if (data.conversationId === conversationId) {
        setLinks((prev) => prev.filter((link) => link.id !== data.messageId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
    };
  }, [socket, conversationId]);

  const handleDeleteClick = async (linkItem) => {
    if (!linkItem?.id) return;

    try {
      await Api_chatInfo.deleteMessage({ items: [{ messageId: linkItem.id, urlIndex: 0 }] });
      socket.emit("deleteMessage", { conversationId, messageId: linkItem.id });
      if (onDeleteLink) {
        onDeleteLink(linkItem.id);
      }
    } catch (error) {
      console.error("Lỗi khi xóa link:", error);
      alert("Không thể xóa link. Vui lòng thử lại.");
    }
  };

  const handleForwardClick = (linkItem) => {
    setLinkToForward(linkItem);
    setIsShareModalOpen(true);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setLinkToForward(null);
  };

  const handleLinkShared = async (targetConversations, shareContent) => {
    if (!linkToForward?.messageId || !userId || !targetConversations?.length) return;

    try {
      const response = await Api_chatInfo.forwardMessage({
        messageId: linkToForward.messageId,
        targetConversationIds: targetConversations,
        userId,
        content: shareContent,
      });
      if (Array.isArray(response)) {
        setIsShareModalOpen(false);
        if (onForwardLink) {
          onForwardLink(linkToForward, targetConversations, shareContent);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chuyển tiếp link:", error);
      alert("Không thể chuyển tiếp link. Vui lòng thử lại.");
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Liên kết</h3>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="relative group bg-gray-100 p-2 rounded-md"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
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
                onClick={() => handleDeleteClick(link)}
                className="text-gray-300 hover:text-red-500"
              >
                <FaTrash size={16} />
              </button>
              <button
                onClick={() => handleForwardClick(link)}
                className="text-gray-300 hover:text-blue-500"
              >
                <FaShare size={16} />
              </button>
              <a
                href={link.url}
                className="text-gray-300 hover:text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
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
          onClose={() => setIsOpen(false)}
          onDelete={fetchLinks}
          userId={userId}
        />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleLinkShared}
        userId={userId}
        messageId={linkToForward?.messageId}
      />
    </div>
  );
};

export default GroupLinks;