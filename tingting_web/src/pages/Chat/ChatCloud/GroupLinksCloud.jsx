import React, { useState, useEffect } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { FaTrash, FaShare } from "react-icons/fa";
import StoragePageCloud from "./StoragePageCloud";
import axios from "axios";

const GroupLinksCloud = ({
  conversationId,
  onDeleteLink,
  onForwardLink,
  userId,
  cloudMessages,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  useEffect(() => {
    if (!conversationId || conversationId !== "my-cloud" || !cloudMessages)
      return;

    const linkMessages = cloudMessages
      .filter((msg) => {
        return (
          msg.content?.match(/^(https?:\/\/[^\s]+)/) &&
          (!msg.fileUrls || msg.fileUrls.length === 0)
        );
      })
      .map((msg) => ({
        id: msg.messageId,
        title: msg.content || "Không có tiêu đề",
        url: msg.content.match(/^(https?:\/\/[^\s]+)/)[0],
      }));
    setLinks(linkMessages);
  }, [conversationId, cloudMessages]);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  const handleDeleteClick = async (linkItem, event) => {
    event.stopPropagation();
    if (!linkItem?.id) {
      console.error("Không có id link để xóa.");
      return;
    }

    try {
      const response = await axios.delete(
        `http://184.73.0.29:3000/api/messages/${linkItem.id}`
      );
      if (response.data?.message) {
        if (onDeleteLink) onDeleteLink(linkItem.id);
        setLinks(links.filter((link) => link.id !== linkItem.id));
      }
    } catch (error) {
      console.error("Lỗi khi xóa liên kết:", error);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Liên kết</h3>
      <div className="space-y-2">
        {links.length > 0 ? (
          links.map((link, index) => (
            <div
              key={link.id || index}
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
                  className="text-gray-300 hover:text-red-500"
                  title="Xóa"
                  onClick={(e) => handleDeleteClick(link, e)}
                >
                  <FaTrash size={16} />
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
          ))
        ) : (
          <p className="text-gray-500 text-sm">Không có liên kết nào.</p>
        )}
      </div>

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
          onDelete={handleDeleteInStorage}
          userId={userId}
          cloudMessages={cloudMessages}
          initialTab="links" // Đặt tab mặc định khi mở từ GroupLinksCloud
        />
      )}
    </div>
  );
};

export default GroupLinksCloud;
