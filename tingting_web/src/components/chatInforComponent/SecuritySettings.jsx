import React, { useState, useEffect } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaEye } from "react-icons/fa"; // Thêm FaEye cho nút "Hiện"
import axios from "axios";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const SecuritySettings = ({ chatId, userId, setChatInfo }) => {
    const [isHidden, setIsHidden] = useState(false);
    const [pin, setPin] = useState("");
    const [showPinInput, setShowPinInput] = useState(false);
    const [isGroup, setIsGroup] = useState(false);

    useEffect(() => {
        const fetchChatInfo = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/conversations/${chatId}`);
                setIsGroup(response.data.isGroup);

                // Tìm participant tương ứng với userId để kiểm tra isHidden
                const participant = response.data.participants.find(p => p.userId === userId);
                setIsHidden(participant ? participant.isHidden : false);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin cuộc trò chuyện:", error);
            }
        };
        fetchChatInfo();
    }, [chatId, userId]);

    const handleToggle = (checked) => {
        if (checked) {
            setShowPinInput(true);
        } else {
            handleHideChat(false); // Gọi API để hiện trò chuyện ngay lập tức
        }
    };

    const handleHideChat = async (hide) => {
        try {
            await Api_chatInfo.hideChat(chatId, { userId, isHidden: hide });
            setIsHidden(hide);
            if (!hide) {
                setShowPinInput(false); // Đóng form PIN khi hiện lại trò chuyện
            }
        } catch (error) {
            console.error("Lỗi khi ẩn/hiện trò chuyện:", error);
            alert("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
        }
    };

    const handleSubmitPin = () => {
        if (pin.length === 4) {
            handleHideChat(true); // Gọi API để ẩn trò chuyện
            setShowPinInput(false);
            setPin(""); // Reset mã PIN sau khi thành công
        } else {
            alert("Mã PIN phải có 4 chữ số!");
        }
    };

    const handleDeleteHistory = async () => {
        console.log("userId:", userId);
        console.log("chatId:", chatId);

        try {
            await Api_chatInfo.deleteHistory(chatId, { userId });
            alert("Đã ẩn lịch sử trò chuyện khỏi tài khoản của bạn!");
        } catch (error) {
            console.error("Lỗi khi xóa lịch sử trò chuyện:", error);
            alert("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
        }
    };

    const handleLeaveGroup = async () => {
        if (!isGroup) return;

        console.log("userId:", userId);
        console.log("chatId:", chatId);

        if (!userId) {
            console.error("userId không tồn tại!");
            return;
        }

        try {
            await Api_chatInfo.removeParticipant(chatId, { userId });
            alert("Bạn đã rời khỏi nhóm!");
            setChatInfo((prevChatInfo) => ({
                ...prevChatInfo,
                participants: prevChatInfo?.participants?.filter(p => p.userId !== userId) || [],
            }));
        } catch (error) {
            console.error("Lỗi khi rời nhóm:", error);
            if (error.response) {
                console.error("Phản hồi từ máy chủ:", error.response.data);
                console.error("Mã lỗi:", error.response.status);
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

            {/* Nút "Hiện" nếu trò chuyện đã ẩn */}
            {isHidden && (
                <button
                    className="w-full text-green-500 text-left flex items-center gap-2 mt-2"
                    onClick={() => handleHideChat(false)}
                >
                    <FaEye size={16} />
                    Hiện trò chuyện
                </button>
            )}

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
                <button
                    className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
                    onClick={handleLeaveGroup}
                >
                    <FaDoorOpen size={16} />
                    Rời nhóm
                </button>
            )}
        </div>
    );
};

export default SecuritySettings;