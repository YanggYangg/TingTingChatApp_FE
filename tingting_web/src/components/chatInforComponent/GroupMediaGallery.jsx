import React, { useState } from "react";

const GroupMediaGallery = () => {
  const [showAll, setShowAll] = useState(false);
  const images = [
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://didongviet.vn/dchannel/wp-content/uploads/2024/03/24-hinh-nen-dien-thoai-dep-nhat-hien-nay-didongviet.jpg",
    "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg"
  ];

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
      <div className="grid grid-cols-4 gap-2">
        {(showAll ? images : images.slice(0, 4)).map((src, index) => (
          <img key={index} src={src} alt="media" className="w-16 h-16 rounded-md" />
        ))}
      </div>
      {!showAll && (
        <button
          className="mt-2 text-blue-500 text-sm hover:underline"
          onClick={() => setShowAll(true)}
        >
          Xem tất cả
        </button>
      )}
    </div>
  );
};

export default GroupMediaGallery;
