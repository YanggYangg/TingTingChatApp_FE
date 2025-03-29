import React, { useState, useEffect } from "react";
import { AiOutlineLink } from "react-icons/ai";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupLinks = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const fetchLinks = async () => {
      try {
        console.log("Gửi request đến API...");
        const response = await Api_chatInfo.getChatLinks(chatId);

        console.log("Dữ liệu API trả về:", response);

        const linkData = Array.isArray(response) ? response : response?.data;

        if (Array.isArray(linkData)) {
          const filteredLinks = linkData
            .filter((item) => item?.messageType === "link")
            .map((item) => ({
              title: item?.content || "Không có tiêu đề",
              url: item?.linkURL || "#",
              date: item?.createdAt?.split("T")[0] || "Không có ngày",
              sender: item?.userId || "Không rõ người gửi",
            }));

          // Sắp xếp link theo thời gian (giả sử có trường 'createdAt')
          const sortedLinks = filteredLinks.sort((a, b) => {
            if (a.date && b.date) {
              return new Date(b.date) - new Date(a.date);
            } else {
              return 0;
            }
          });

          // Lấy 3 link đầu tiên
          setLinks(sortedLinks.slice(0, 3));
        } else {
          setLinks([]);
          console.warn("API không trả về mảng hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách link:", error);
      }
    };

    fetchLinks();
  }, [chatId]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Liên kết</h3>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
            <div>
              <p className="text-sm font-semibold">{link.title}</p>
              <a
                href={link.url}
                className="text-blue-500 text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
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