import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoragePage from "./StoragePage";

const GroupMediaGallery = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const images = [
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg",
  ];

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
      <div className="grid grid-cols-4 grid-rows-2 gap-2">
        {images.slice(0, 8).map((src, index) => (
          <img
            key={index}
            src={src}
            alt="media"
            className="w-16 h-16 rounded-md"
          />
        ))}
      </div>

      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>

      {/* {isOpen && (
        <div>
          <StoragePage />
        </div>
      )} */}


      {isOpen && <StoragePage onClose={() => setIsOpen(false)}/>}
    </div>
  );
};

export default GroupMediaGallery;
