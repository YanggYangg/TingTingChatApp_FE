import React, { useState } from "react";
import { AiOutlineLink } from "react-icons/ai";
import StoragePage from "./StoragePage";

const GroupLinks = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const links = [
    { title: "Google", url: "https://www.google.com" },
    { title: "Nguyễn Kiến Thức", url: "https://www.facebook.com" },
    { title: "Đảm bảo chất lượng và kiểm thử", url: "https://docs.google.com" },
  ];

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Link</h3>
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
      
      {isOpen && <StoragePage onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupLinks;