import React, { useState } from "react";
import { AiOutlineLink } from "react-icons/ai"; // Import icon từ react-icons

const GroupLinks = () => {
  const [showAll, setShowAll] = useState(false);

  // Danh sách link mặc định
  const links = [
    { title: "Google", url: "https://www.google.com" },
    { title: "Nguyễn Kiến Thức", url: "https://www.facebook.com" },
    { title: "Đảm bảo chất lượng và kiểm thử", url: "https://docs.google.com" },
    { title: "Microsoft Copilot", url: "https://copilot.microsoft.com" },
    { title: "ChatGPT", url: "https://chat.openai.com" },
  ];

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Link</h3>
      <div className="space-y-2">
        {(showAll ? links : links.slice(0, 3)).map((link, index) => (
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
      {!showAll && links.length > 3 && (
        <button className="text-blue-500 mt-2 hover:underline" onClick={() => setShowAll(true)}>
          Xem tất cả
        </button>
      )}
    </div>
  );
};

export default GroupLinks;
