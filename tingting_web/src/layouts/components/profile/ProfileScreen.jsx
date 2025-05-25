import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaComment } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";
import { Api_Profile } from "../../../../apis/api_profile";
import { Api_Conversation } from "../../../../apis/Api_Conversation";
import { toast } from "react-toastify";

const DEFAULT_AVATAR =
  "https://png.pngtree.com/png-clipart/20191122/original/pngtree-user-vector-icon-with-white-background-png-image_5168884.jpg";
const DEFAULT_COVER_PHOTO =
  "https://inkythuatso.com/uploads/thumbnails/800/2022/04/anh-bia-zalo-canh-dep-thien-nhien-024637306-20-09-22-39.jpg";

const ProfileScreen = ({ userId, onClose, socket }) => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem("userId");

  // Lấy thông tin hồ sơ
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Api_Profile.getProfile(userId);
        setProfile(response?.data?.user || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  // Xử lý nhắn tin
  const handleStartConversation = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để bắt đầu trò chuyện.");
      return;
    }
    if (userId === currentUserId) {
      toast.error("Bạn không thể trò chuyện với chính mình!");
      return;
    }
    try {
      const res = await Api_Conversation.getOrCreateConversation(currentUserId, userId);
      if (res?.conversationId) {
        const messageData = {
          id: res.conversationId,
          isGroup: false,
          participants: [{ userId: currentUserId }, { userId }],
        };
        dispatch(setSelectedMessage(messageData));
        onClose(); // Đóng modal sau khi bắt đầu trò chuyện
      } else {
        toast.error(res?.message || "Không thể tạo hội thoại.");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error(error?.message || "Lỗi khi bắt đầu trò chuyện.");
    }
  };

  // Format ngày sinh
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 text-lg">Đang tải thông tin hồ sơ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Giao diện khi không có dữ liệu
  if (!profile) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-gray-700 text-lg font-medium">Không thể tải thông tin hồ sơ.</p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft size={16} />
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Giao diện modal chính
  return (
    <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg overflow-hidden relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold"
          title="Đóng"
        >
          ×
        </button>

        {/* Ảnh bìa */}
        <div className="relative">
          <img
            src={profile.coverPhoto || DEFAULT_COVER_PHOTO}
            className="w-full h-48 object-cover"
            alt="Cover Photo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition duration-300"
          >
            <FaArrowLeft size={16} className="text-blue-600" />
          </button>
        </div>

        {/* Nội dung hồ sơ */}
        <div className="px-6 py-8 -mt-16">
          <h1 className="text-2xl font-bold text-gray-800 text-center">Thông tin tài khoản</h1>
          <div className="flex justify-center">
            <img
              src={profile.avatar || DEFAULT_AVATAR}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover transform hover:scale-105 transition duration-300"
              alt={`${profile.firstname} ${profile.surname}`}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mt-4 text-center">
            {`${profile.firstname} ${profile.surname}`}
          </h2>
          <button
            onClick={handleStartConversation}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2 mx-auto"
          >
            <FaComment size={16} />
            Nhắn tin
          </button>

          {/* Thông tin cá nhân */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 gap-4 text-left">
              <div>
                <p className="text-sm font-semibold text-blue-600">Email</p>
                <p className="text-gray-700">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">Giới tính</p>
                <p className="text-gray-700">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">Ngày sinh</p>
                <p className="text-gray-700">{formatDate(profile.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600">Điện thoại</p>
                <p className="text-gray-700">{profile.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;