import React, { useState, useEffect } from "react";
// import { useNavigate } from 'react-router-dom';
import axios from "axios";

import { Api_Profile } from "../../../apis/api_profile.js";

function InfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    firstname: "",
    surname: "",
    day: "1",
    month: "1",
    year: "2025",
    gender: "female",
    phone: "",
    avatar: null,
    coverPhoto: null,
  });

  useEffect(() => {
    const loadProfileFromLocal = () => {
      try {
        const storedProfile = localStorage.getItem("profile");
        if (!storedProfile) return;

        const profile = JSON.parse(storedProfile);
        const date = new Date(profile.dateOfBirth);
        const day = date.getDate().toString();
        const month = (date.getMonth() + 1).toString();
        const year = date.getFullYear().toString();

        setFormData((prev) => ({
          ...prev,
          firstname: profile.firstname || "",
          surname: profile.surname || "",
          phone: profile.phone || "",
          avatar:
            profile.avatar ||
            "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
          coverPhoto: profile.coverPhoto || null,
          gender: profile.gender || "female",
          day,
          month,
          year,
        }));
      } catch (error) {
        console.error("Error loading profile from localStorage:", error);
      }
    };

    loadProfileFromLocal();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log("file", file);
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let avatarUrl = formData.avatar;

      // Nếu người dùng chọn ảnh mới thì upload lên S3
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append("avatar", selectedFile);
        console.log("uploadForm", uploadForm);

        const uploadRes = await axios.put(
          "http://localhost:3001/api/v1/profile/upload", // bạn đổi lại nếu cần
          uploadForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
          }
        );
        console.log("uploadRes = ", uploadRes);
        avatarUrl = uploadRes.data.data.fileUrl; // backend trả về link ảnh trên S3
        console.log("avatarUrl = ", avatarUrl);
      }

      const updatedForm = {
        ...formData,
        avatar: avatarUrl,
      };

      const response = await Api_Profile.updateProfile(
        localStorage.getItem("userId"),
        updatedForm
      );
      console.log("Profile updated successfully:", response);
      localStorage.setItem("profile", JSON.stringify(response.data.profile));
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2025 - i);
  const months = [
    { value: "1", label: "Jan" },
    { value: "2", label: "Feb" },
    { value: "3", label: "Mar" },
    { value: "4", label: "Apr" },
    { value: "5", label: "May" },
    { value: "6", label: "Jun" },
    { value: "7", label: "Jul" },
    { value: "8", label: "Aug" },
    { value: "9", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 bg-black/30 backdrop-blur-mdbg-black/30 backdrop-blur-md ">
      <div className="bg-white text-black p-6 rounded-lg w-[500px] shadow-lg max-h-[90vh] overflow-y-auto relative ">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl text-gray-500 hover:text-black"
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold mb-4">Thông tin tài khoản</h2>
        {/* Ảnh đại diện */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div className="flex flex-col items-center mb-4">
            <img
              src={formData.avatar || "https://via.placeholder.com/100"}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
            <input
              type="file"
              accept="image/*"
              name="avatar"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>
          <div className="flex space-x-3">
            <input
              name="firstname"
              placeholder="Tên"
              value={formData.firstname}
              onChange={handleChange}
              className="border px-3 py-2 w-1/2 rounded"
            />
            <input
              name="surname"
              placeholder="Họ"
              value={formData.surname}
              onChange={handleChange}
              className="border px-3 py-2 w-1/2 rounded"
            />
          </div>

          <div className="flex space-x-3">
            <select
              name="day"
              value={formData.day}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-1/3"
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              name="month"
              value={formData.month}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-1/3"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-1/3"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Giới tính</label>
            <div className="flex items-center space-x-4">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleChange}
                />{" "}
                Nữ
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleChange}
                />{" "}
                Nam
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === "other"}
                  onChange={handleChange}
                />{" "}
                Khác
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4"
          >
            Cập nhật
          </button>
        </form>
      </div>
    </div>
  );
}

export default InfoModal;
