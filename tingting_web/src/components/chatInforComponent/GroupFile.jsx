import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaRegFolderOpen, FaDownload } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupFile = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const fetchFiles = async () => {
      try {
        console.log("Gửi request đến API...");
        const response = await Api_chatInfo.getChatFiles(chatId);

        console.log("Dữ liệu API trả về:", response);

        const fileData = Array.isArray(response) ? response : response?.data;

        if (Array.isArray(fileData)) {
          // Sắp xếp file theo thời gian (nếu có trường thời gian trong file)
          // Nếu không có trường thời gian, có thể bỏ qua bước này hoặc sắp xếp theo cách khác
          const sortedFiles = fileData.sort((a, b) => {
            // Giả sử mỗi file có trường 'createdAt' hoặc 'uploadDate'
            // Nếu không có, bạn cần điều chỉnh theo trường thời gian của file trong API
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else {
                return 0; // Giữ nguyên thứ tự nếu không có thông tin thời gian
            }
          });

          // Lấy 3 file đầu tiên
          setFiles(sortedFiles.slice(0, 3));
        } else {
          setFiles([]);
          console.warn("API không trả về mảng hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách file:", error);
      }
    };

    fetchFiles();
  }, [chatId]);

  // Hàm tải file về máy
  const handleDownload = (file) => {
    if (!file?.linkURL) {
      console.error("Không có link file để tải.");
      return;
    }

    const link = document.createElement("a");
    link.href = file.linkURL;
    link.setAttribute("download", file.content || "file"); // Đặt tên file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold"
              >
                {file.content || "Không có tên"}
              </a>
              <div className="flex gap-2">
                {/* Nút mở file */}
                <button className="text-gray-500 hover:text-blue-500">
                  <FaRegFolderOpen size={18} />
                </button>
                {/* Nút tải xuống */}
                <button
                  className="text-gray-500 hover:text-blue-500"
                  onClick={() => handleDownload(file)}
                >
                  <FaDownload size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Không có tệp nào.</p>
        )}
      </div>
      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>
      {isOpen && <StoragePage files={files} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupFile;