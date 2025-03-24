import React, { useState, useEffect } from "react";
import axios from "axios";
import { AiOutlineLink } from "react-icons/ai";
import StoragePage from "./StoragePage";

const GroupLinks = ({chatId}) => {
  // const chatId = "67e0eda53261750c58989c24";
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/${chatId}/links`);
        const filteredLinks = response.data
          .filter(item => item.message.messageType === "link") // Chỉ lấy tin nhắn chứa link
          .map(item => ({
            title: item.message.content, // Tiêu đề link
            url: item.message.linkURL, // Đường dẫn link
          }));
        setLinks(filteredLinks);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách link:", error);
      }
    };

    if (chatId) {
      fetchLinks();
    }
  }, [chatId]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Liên kết</h3>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
            <div>
              <p className="text-sm font-semibold">{link.title}</p>
              <a href={link.url} className="text-blue-500 text-xs" target="_blank" rel="noopener noreferrer">
                {link.url}
              </a>
            </div>
            <button className="text-gray-500 hover:text-blue-500">
              <AiOutlineLink size={20} />
            </button>
          </div>
        ))}
      </div>

      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>

      {isOpen && <StoragePage links={links} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupLinks;
