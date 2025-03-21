import React, { useState } from "react";
import { FaRegFolderOpen } from "react-icons/fa";
import StoragePage from "./StoragePage";

const GroupFile = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const files = [
    { name: "Tài liệu 1.pdf", url: "https://example.com/tailieu1.pdf" },
    { name: "Hướng dẫn sử dụng.docx", url: "https://example.com/huongdan.docx" },
    { name: "Báo cáo tài chính.xlsx", url: "https://example.com/baocao.xlsx" },
  ];

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
      
      {isOpen && <StoragePage onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupFile;
