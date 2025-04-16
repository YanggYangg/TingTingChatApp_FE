import React, { useState, useEffect } from "react";
import { FaTimes, FaSearch, FaUsers, FaUser } from "react-icons/fa";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../apis/api_profile";

const ShareModal = ({ isOpen, onClose, onShare, messageToForward, userId, messageId }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userCache, setUserCache] = useState({});

    console.log("ShareModal props:", { isOpen, userId, messageToForward, messageId });

    useEffect(() => {
        console.log("ShareModal opened: with userId", userId);
        if (!isOpen || !userId) return;

        const fetchConversations = async () => {
            setLoading(true);
            setError(null);

            if (!userId) {
                setError("Không có userId để lấy danh sách cuộc trò chuyện.");
                setLoading(false);
                return;
            }

            try {
                const response = await Api_chatInfo.getConversationById(userId);
                console.log("Full response from getAllConversations:", response);
                setConversations(response || []);
                console.log("Fetched conversations:", response);

                const userIds = new Set();
                response.forEach((conv) => {
                    if (!conv.isGroup) {
                        const otherParticipant = conv.participants.find(
                            (p) => p.userId !== userId
                        );
                        if (otherParticipant) {
                            userIds.add(otherParticipant.userId);
                        }
                    }
                });

                const userPromises = Array.from(userIds).map(async (id) => {
                    try {
                        const userResponse = await Api_Profile.getProfile(id);
                        console.log("Fetched user profile:", userResponse);
                        return { id, firstname: userResponse?.data?.user?.firstname + " " + userResponse?.data?.user?.surname };
                    
                    } catch (err) {
                        console.error(`Error fetching profile for user ${id}:`, err);
                        return { id, firstname: "Người dùng không xác định" };
                    }
                });

                const users = await Promise.all(userPromises);
                const userMap = users.reduce((acc, user) => {
                    acc[user.id] = user.firstname;
                    return acc;
                }, {});
                setUserCache(userMap);
            } catch (err) {
                console.error("Error fetching conversations:", err);
                setError("Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [isOpen, userId]);

    const handleSelectConversation = (conversationId) => {
        setSelectedConversations((prev) =>
            prev.includes(conversationId)
                ? prev.filter((id) => id !== conversationId)
                : [...prev, conversationId]
        );
    };

    const handleShare = async () => {
        if (selectedConversations.length === 0) {
            alert("Vui lòng chọn ít nhất một cuộc trò chuyện để chia sẻ.");
            return;
        }

        if (!userId) {
            setError("Không có userId để chuyển tiếp tin nhắn.");
            return;
        }

        if (!messageId) {
            setError("Không có messageId để chuyển tiếp tin nhắn.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = {
                messageId: [messageId], // Sử dụng messageId từ props
                targetConversationIds: selectedConversations,
                userId,
                content: content.trim() || undefined,
            };

            console.log("Forwarding message with data:", data);

            const response = await Api_chatInfo.forwardMessage(data);
            console.log("Forwarded messages:", response);
            alert("Chuyển tiếp tin nhắn thành công!");
            onShare(selectedConversations, content);
        } catch (err) {
            console.error("Error forwarding message:", err);
            setError(err.response?.data?.message || "Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const getConversationName = (conversation) => {
        if (conversation.name) {
            return conversation.name;
        }
        if (!conversation.isGroup && conversation.participants) {
            const otherParticipant = conversation.participants.find(
                (p) => p.userId !== userId
            );
            return userCache[otherParticipant?.userId] || "Người dùng không xác định";
        }
        return "Cuộc trò chuyện không có tên";
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Chia sẻ</h2>
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                    >
                        <FaTimes className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div className="p-2 border-b">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Tìm kiếm..."
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 text-center text-gray-500">Đang tải...</div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Không có cuộc trò chuyện nào.</div>
                ) : (
                    <ul className="overflow-y-auto max-h-[300px] p-2">
                        {conversations.map((conversation) => (
                            <li key={conversation._id} className="flex items-center py-2">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={selectedConversations.includes(conversation._id)}
                                    onChange={() => handleSelectConversation(conversation._id)}
                                />
                                <div className="ml-3 flex items-center">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                                        {conversation.imageGroup ? (
                                            <img
                                                src={conversation.imageGroup}
                                                alt={getConversationName(conversation)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : conversation.isGroup ? (
                                            <FaUsers className="w-6 h-6 text-gray-500" />
                                        ) : (
                                            <FaUser className="w-6 h-6 text-gray-500" />
                                        )}
                                        {conversation.participants.length > 2 && conversation.isGroup && (
                                            <span className="absolute bottom-0 left-0 bg-green-500 text-white text-[10px] rounded-full px-1">
                                                {conversation.participants.length}
                                            </span>
                                        )}
                                        {conversation.participants.length <= 2 && !conversation.isGroup && (
                                            <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[10px] rounded-full px-1">
                                                99+
                                            </span>
                                        )}
                                    </div>
                                    <span className="ml-2 text-sm text-gray-700">
                                        {getConversationName(conversation)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="p-2 border-t">
                    <div className="text-sm text-gray-500">Chia sẻ tin nhắn</div>
                    <div className="mt-1 rounded-md shadow-sm">
                        <textarea
                            rows={2}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Nhập tin nhắn..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end p-4">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={handleShare}
                        disabled={loading}
                    >
                        {loading ? "Đang chia sẻ..." : "Chia sẻ"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;