import React, { useState, useEffect } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const SecuritySettings = ({ conversationId, userId, setChatInfo, userRoleInGroup }) => {
    const [isHidden, setIsHidden] = useState(false);
    const [pin, setPin] = useState("");
    const [showPinInput, setShowPinInput] = useState(false);
    const [isGroup, setIsGroup] = useState(false);

    useEffect(() => {
        const fetchChatInfo = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/conversations/${conversationId}`);
                setIsGroup(response.data.isGroup);
                const participant = response.data.participants.find(p => p.userId === userId);
                setIsHidden(participant ? participant.isHidden : false);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cuộc trò chuyện:", error);
            }
        };
        fetchChatInfo();
    }, [conversationId, userId]);

    const handleToggle = async (checked) => {
        if (checked && !isHidden) {
            setShowPinInput(true); // Hiển thị form PIN khi ẩn lần đầu
        } else {
            await handleHideChat(checked, null); // Hiện lại không cần PIN
        }
    };

    const handleHideChat = async (hide, pin) => {
        try {
            await Api_chatInfo.hideChat(conversationId, { userId, isHidden: hide, pin });
            setIsHidden(hide);
            setShowPinInput(false);
            setPin("");
        } catch (error) {
            console.error("Lỗi khi ẩn/hiện trò chuyện:", error);
            alert("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
        }
    };

    const handleSubmitPin = () => {
        if (pin.length === 4) {
            handleHideChat(true, pin); // Gửi mã PIN lên backend
        } else {
            alert("Mã PIN phải có 4 chữ số!");
        }
    };
    console.log("conversationId xóa" , conversationId);
    const handleDeleteHistory = async () => {
        try {
          await Api_chatInfo.deleteConversationHistory(conversationId);
          alert("Đã xóa lịch sử trò chuyện!");
        } catch (error) {
          console.error("Lỗi khi xóa lịch sử trò chuyện:", error);
          alert("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
        }
      };

    const handleLeaveGroup = async () => {
        if (!isGroup) return;

        if (!userId) {
            console.error("userId không tồn tại!");
            return;
        }

        const confirmLeave = window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?");
        if (confirmLeave) {
            try {
                await Api_chatInfo.removeParticipant(conversationId, { userId });
                alert("Bạn đã rời khỏi nhóm!");
                setChatInfo((prevChatInfo) => ({
                    ...prevChatInfo,
                    participants: prevChatInfo?.participants?.filter(p => p.userId !== userId) || [],
                }));
            } catch (error) {
                console.error("Lỗi khi rời nhóm:", error);
            }
        }
    };

    const handleDisbandGroup = async () => {
        if (!isGroup || userRoleInGroup !== 'admin') {
            return;
        }
        console.log("conversationId giải tán nhóm" , conversationId);
        console.log("userId giải tán nhóm" , userId);

        const confirmDisband = window.confirm("Bạn có chắc chắn muốn giải tán nhóm này không? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất.");
        if (confirmDisband) {
            try {
                await Api_chatInfo.disbandGroup(conversationId, { userId });
                alert("Nhóm đã được giải tán!");
                // Có thể bạn muốn điều hướng người dùng hoặc cập nhật giao diện sau khi giải tán nhóm
                // Ví dụ: window.location.href = "/"; // Chuyển về trang chính
            } catch (error) {
                console.error("Lỗi khi giải tán nhóm:", error);
                alert("Lỗi khi giải tán nhóm. Vui lòng thử lại.");
            }
        }
    };

    return (
        <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Thiết lập bảo mật</h3>

            {/* Ẩn trò chuyện */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Ẩn trò chuyện</span>
                <Switch
                    onChange={handleToggle}
                    checked={isHidden}
                    offColor="#ccc"
                    onColor="#3b82f6"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    height={22}
                    width={44}
                    handleDiameter={18}
                />
            </div>

            {/* Form nhập mã PIN */}
            {showPinInput && (
                <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                    <label className="block text-sm font-semibold mb-1">Nhập mã PIN (4 chữ số)</label>
                    <input
                        type="password"
                        maxLength="4"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        placeholder="****"
                    />
                    <button
                        onClick={handleSubmitPin}
                        className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Xác nhận
                    </button>
                </div>
            )}

            {/* Các nút hành động */}
            <button
                className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
                onClick={handleDeleteHistory}
            >
                <FaTrash size={16} />
                Xóa lịch sử trò chuyện
            </button>
            {isGroup && (
                <>
                    <button
                        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
                        onClick={handleLeaveGroup}
                    >
                        <FaDoorOpen size={16} />
                        Rời nhóm
                    </button>
                    {userRoleInGroup === 'admin' && (
                        <button
                            className="w-full text-red-600 text-left flex items-center gap-2 mt-2"
                            onClick={handleDisbandGroup}
                        >
                            <FaSignOutAlt size={16} />
                            Giải tán nhóm
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default SecuritySettings;