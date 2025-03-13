import React, { useState } from "react";
import { FaRegFolderOpen } from "react-icons/fa"; // Import icon thư mục mở

const GroupFile = () => {
  const [showAll, setShowAll] = useState(false);
  const files = [
    { name: "Tài liệu 1.pdf", url: "https://example.com/tailieu1.pdf" },
    { name: "Hướng dẫn sử dụng.docx", url: "https://example.com/huongdan.docx" },
    { name: "Báo cáo tài chính.xlsx", url: "https://example.com/baocao.xlsx" },
    { name: "Slide bài giảng.pptx", url: "https://example.com/slide.pptx" },
    { name: "Kế hoạch dự án.pdf", url: "https://example.com/kehoach.pdf" },
  ];

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {(showAll ? files : files.slice(0, 3)).map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
          >
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm font-semibold"
            >
              {file.name}
            </a>
            <button className="text-gray-500 hover:text-blue-500">
              <FaRegFolderOpen size={18} />
            </button>
          </div>
        ))}
      </div>
      {!showAll && files.length > 3 && (
        <button
          className="text-blue-500 mt-2 hover:underline"
          onClick={() => setShowAll(true)}
        >
          Xem tất cả
        </button>
      )}
    </div>
  );
};

export default GroupFile;
