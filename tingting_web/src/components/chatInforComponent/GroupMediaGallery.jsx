import React, { useState, useEffect } from "react";
import axios from "axios";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupMediaGallery = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchImages = async () => {
      try {
        console.log("🔍 Đang lấy dữ liệu từ API...");
        const response = await Api_chatInfo.getChatMedia(chatId);
        console.log("✅ Dữ liệu API nhận được:", response);

        const mediaData = Array.isArray(response?.data) ? response.data : response;

        if (Array.isArray(mediaData)) {
          const filteredImages = mediaData
            .filter((item) => item?.messageType === "image")
            .map((item) => ({
              src: item?.linkURL || "#",
              name: item?.content || "Không có tên",
            }));

          setImages(filteredImages);
        } else {
          console.warn("⚠️ API không trả về dữ liệu hợp lệ.");
          setImages([]);
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu ảnh:", error);
      }
    };

    fetchImages();
  }, [chatId]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn một file!");
      return;
    }

    setUploading(true);
    const tempImage = { src: previewImage, isTemporary: true };
    setImages((prevImages) => [tempImage, ...prevImages]);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("chatId", chatId);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/messages/send-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImages((prevImages) =>
        prevImages.map((img) =>
          img.isTemporary ? { src: response.data.imageUrl, isTemporary: false } : img
        )
      );

      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên:", error);
      alert("Lỗi khi tải ảnh lên!");
      setImages((prevImages) => prevImages.filter((img) => !img.isTemporary));
    } finally {
      setUploading(false);
    }
  };

  // Hàm tải ảnh bằng fetch, tạo Blob và download
  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi tải file (CORS hoặc khác):", error);
      alert("Fetch bị chặn, thử tải trực tiếp!");

      // Fallback: Tải bằng <a> trực tiếp
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;       // Mở link ảnh trực tiếp
      fallbackLink.download = filename; 
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  return (
    <div >
      {/* Gallery chính */}
      <div className="flex-1">
        <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img.src}
                alt={img.name}
                className={`w-16 h-16 rounded-md object-cover cursor-pointer transition-all hover:scale-105 ${
                  img.isTemporary ? "opacity-50" : ""
                }`}
                onClick={() => setFullScreenImage(img)}
              />
              {img.isTemporary && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                  ⏳
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Upload Image */}
        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
        <button
          onClick={handleUpload}
          className={`mt-2 w-full text-white text-sm px-4 py-2 rounded transition-all ${
            uploading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={uploading}
        >
          {uploading ? "Đang gửi..." : "Tải lên ảnh"}
        </button>

        {/* Open Storage Page */}
        <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>
      {isOpen && <StoragePage files={images} onClose={() => setIsOpen(false)} />}
      </div>

      {/* 🔥 Modal hiển thị ảnh toàn màn hình */}
      {fullScreenImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative flex bg-white rounded-lg shadow-lg">
            {/* Khu vực hiển thị ảnh lớn */}
            <div className="relative flex items-center justify-center w-[60vw] h-[90vh] p-4">
              <img
                src={fullScreenImage.src}
                alt={fullScreenImage.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg transition-all"
              />
              
              {/* Nút đóng */}
              <button
                className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                onClick={() => setFullScreenImage(null)}
              >
                ✖
              </button>
              
              {/* Nút tải xuống dùng JavaScript để fetch file, fallback nếu lỗi */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(fullScreenImage.src, fullScreenImage.name);
                }}
                className="absolute bottom-2 right-2 bg-white px-4 py-2 rounded text-sm text-gray-800 hover:bg-gray-200 transition-all"
              >
                ⬇ Tải xuống
              </button>
            </div>
  
            {/* Sidebar chứa danh sách ảnh (bên phải) */}
            <div className="w-40 h-[90vh] bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img.src}
                  alt={img.name}
                  className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                    fullScreenImage.src === img.src
                      ? "opacity-100 border-2 border-blue-400"
                      : "opacity-50 hover:opacity-100"
                  }`}
                  onClick={() => setFullScreenImage(img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMediaGallery;
