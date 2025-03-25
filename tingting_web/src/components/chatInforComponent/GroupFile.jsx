import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaRegFolderOpen } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupFile = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const fetchFiles = async () => {
      try {
        console.log("🔍 Gửi request đến API...");
        const response = await Api_chatInfo.getChatFiles(chatId);
        
        console.log("✅ Dữ liệu API trả về:", response); // Kiểm tra toàn bộ response
        
        // Kiểm tra nếu response là một mảng hoặc nếu response.data là mảng
        const fileData = Array.isArray(response) ? response : response?.data;
        
        if (Array.isArray(fileData)) {
          setFiles(fileData);
        } else {
          setFiles([]);
          console.warn("⚠️ API không trả về mảng hợp lệ");
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách file:", error);
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
              <a href={file.linkURL} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-semibold">
                {file.content || "Không có tên"}
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
