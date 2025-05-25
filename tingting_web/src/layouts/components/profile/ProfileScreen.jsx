import React, { useState, useEffect, useCallback } from "react";
import { FaArrowLeft, FaComment } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";
import { useNavigate, useParams } from "react-router-dom";
import { Api_Profile } from "../../../../apis/api_profile";
import { Api_Conversation } from "../../../../apis/Api_Conversation";
import { toast } from "react-toastify";

const DEFAULT_AVATAR =
  "https://png.pngtree.com/png-clipart/20191122/original/pngtree-user-vector-icon-with-white-background-png-image_5168884.jpg";
const DEFAULT_COVER_PHOTO =
  "https://inkythuatso.com/uploads/thumbnails/800/2022/04/anh-bia-zalo-canh-dep-thien-nhien-024637306-20-09-22-39.jpg";

const ProfileScreen = ({ socket }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy currentUserId từ localStorage (hoặc Redux nếu có)
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
  const handleStartConversation = useCallback(async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để bắt đầu trò chuyện.");
      navigate("/login"); // Chuyển hướng đến trang đăng nhập
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
        navigate(`/chat/${res.conversationId}`, { state: { messageData } });
      } else {
        toast.error(res?.message || "Không thể tạo hội thoại.");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error(error?.message || "Lỗi khi bắt đầu trò chuyện.");
    }
  }, [currentUserId, userId, dispatch, navigate]);

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  // Giao diện khi không có dữ liệu
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">Không thể tải thông tin hồ sơ.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2"
          >
            <FaArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Giao diện chính
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Ảnh bìa */}
        <div className="relative">
          <img
            src={profile.coverPhoto || DEFAULT_COVER_PHOTO}
            className="w-full h-80 object-cover"
            alt="Cover Photo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition duration-300"
          >
            <FaArrowLeft size={18} className="text-blue-600" />
          </button>
        </div>

        {/* Nội dung hồ sơ */}
        <div className="relative px-6 py-8 -mt-20">
          <div className="flex justify-center">
            <img
              src={profile.avatar || DEFAULT_AVATAR}
              className="w-36 h-36 rounded-full border-4 border-white shadow-lg object-cover transform hover:scale-105 transition duration-300"
              alt={`${profile.firstname} ${profile.surname}`}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mt-4">
            {`${profile.firstname} ${profile.surname}`}
          </h2>
          <button
            onClick={handleStartConversation}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center mx-auto gap-2"
          >
            <FaComment size={18} />
            Nhắn tin
          </button>

          {/* Thông tin chi tiết */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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