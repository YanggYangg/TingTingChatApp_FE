import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaRegFolderOpen } from "react-icons/fa";
import StoragePage from "./StoragePage";

const GroupFile = ({chatId}) => {
  // const chatId = "67e0eda53261750c58989c24";
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/${chatId}/files`);
        const filteredFiles = response.data
          .filter(item => item.message.messageType === "file") // Lọc tin nhắn kiểu file
          .map(item => ({
            name: item.message.content, // Tên file
            url: item.message.linkURL  // Đường dẫn file
          }));
        setFiles(filteredFiles);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách file:", error);
      }
    };

    fetchFiles();
  }, [chatId]);

  console.log(files);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-semibold">
              {file.name}
            </a>
            <button className="text-gray-500 hover:text-blue-500">
              <FaRegFolderOpen size={18} />
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
      {/* {isOpen && <StoragePage onClose={() => setIsOpen(false)} />} */}
      {isOpen && <StoragePage files={files} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupFile;
