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
      }
      catch (error) {
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

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
      <div className="grid grid-cols-4 gap-2">
        {images.slice(0, 8).map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img.src}
              alt={img.name}
              className={`w-16 h-16 rounded-md object-cover ${img.isTemporary ? "opacity-50" : ""}`}
            />
            {img.isTemporary && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                ⏳
              </div>
            )}
          </div>
        ))}
      </div>

      <input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
      <button
        onClick={handleUpload}
        className={`mt-2 w-full text-white text-sm px-4 py-2 rounded ${uploading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"}`}
        disabled={uploading}
      >
        {uploading ? "Đang gửi..." : "Tải lên ảnh"}
      </button>

      <button
        className="mt-2 w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>

      {isOpen && <StoragePage images={images} onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupMediaGallery;
