import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaRegFolderOpen } from "react-icons/fa";
import StoragePage from "./StoragePage";

const GroupFile = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!chatId) return;
  
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/${chatId}/files`);
        console.log("Dữ liệu API trả về:", response.data); // Debug API response
  
        const filteredFiles = response.data
          .filter(item => item?.messageType === "file") // Kiểm tra chắc chắn messageType là "file"
          .map(item => ({
            name: item?.content || "Không có tên", // Lấy tên file từ content
            url: item?.linkURL || "#", // Lấy đường dẫn file
            date: item?.createdAt?.split("T")[0] || "Không có ngày", // Lấy ngày gửi
            sender: item?.userId || "Không rõ người gửi", // Lấy thông tin người gửi
          }));
  
        setFiles(filteredFiles);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách file:", error);
      }
    };
  
    fetchFiles();
  }, [chatId]);
  
  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-semibold">
                {file.name}
              </a>
              <button className="text-gray-500 hover:text-blue-500">
                <FaRegFolderOpen size={18} />
              </button>
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
