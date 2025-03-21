import React, { useState, useEffect } from "react";
import axios from "axios";
import StoragePage from "./StoragePage";

const DEFAULT_CONVERSATION_ID = "67ddbca30d5c131f4d051593"; // ID mặc định để test

const GroupMediaGallery = ({ conversationId = DEFAULT_CONVERSATION_ID, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/${conversationId}`
        );
        const imageMessages = response.data.filter(
          (msg) => msg.sender[0].messageType === "image"
        );
        setImages(imageMessages.map((msg) => msg.sender[0].content));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách ảnh:", error);
      }
    };

    if (conversationId) {
      fetchImages();
    }
  }, [conversationId]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Hiển thị ảnh tượng trưng
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
    formData.append("conversationId", conversationId);
    formData.append("userId", userId);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/messages/send-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImages((prevImages) => [
        { src: response.data.imageUrl, isTemporary: false },
        ...prevImages.filter((img) => !img.isTemporary),
      ]);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên:", error);
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Ảnh/Video</h3>
      <div className="grid grid-cols-4 grid-rows-2 gap-2">
        {images.slice(0, 8).map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img.src || img}
              alt="media"
              className={`w-16 h-16 rounded-md object-cover ${
                img.isTemporary ? "opacity-50" : ""
              }`}
            />
            {img.isTemporary && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                ⏳
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mt-2"
      />
      <button
        onClick={handleUpload}
        className={`mt-2 w-full text-white text-sm px-4 py-2 rounded ${
          uploading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={uploading}
      >
        {uploading ? "Đang gửi..." : "Upload Ảnh"}
      </button>

      <button
        className="mt-2 w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>

      {isOpen && <StoragePage onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default GroupMediaGallery;
