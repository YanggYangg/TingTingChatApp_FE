import React, { useState, useEffect, useCallback } from "react";
import { FaTimes, FaSearch, FaUsers, FaUser, FaCheck, FaTrash } from "react-icons/fa";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../apis/api_profile";
import { toast } from "react-toastify";

const ShareModal = ({ isOpen, onClose, onShare, messageToForward, userId, messageId }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userCache, setUserCache] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredConversations, setFilteredConversations] = useState([]);

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

    // Sử dụng useCallback để tránh tạo mới hàm ở mỗi lần render
    const handleSearch = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    useEffect(() => {
        const filtered = conversations.filter((conv) => {
            const name = getConversationName(conv).toLowerCase();
            return name.includes(searchTerm.toLowerCase());
        });
        setFilteredConversations(filtered);
    }, [conversations, searchTerm, userCache, userId]);

    const handleSelectConversation = (conversationId) => {
        setSelectedConversations((prev) =>
            prev.includes(conversationId)
                ? prev.filter((id) => id !== conversationId)
                : [...prev, conversationId]
        );
    };

    const handleRemoveSelectedConversation = (conversationId) => {
        setSelectedConversations((prev) => prev.filter((id) => id !== conversationId));
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
                messageId: [messageId],
                targetConversationIds: selectedConversations,
                userId,
                content: content.trim() || undefined,
            };

            console.log("Forwarding message with data:", data);

            const response = await Api_chatInfo.forwardMessage(data);
            console.log("Forwarded messages:", response);
            // alert("Chuyển tiếp tin nhắn thành công!");
            toast.success("Chuyển tiếp tin nhắn thành công!");
            onShare(selectedConversations, content);
            onClose();
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

    const getConversationImage = (conversation) => {
        if (conversation.imageGroup) {
            return conversation.imageGroup;
        }
        if (!conversation.isGroup && conversation.participants) {
            // You might want to fetch the other user's profile picture here if available
            return null;
        }
        return null;
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 ${isOpen ? "" : "hidden"}`}>
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
                <div className="p-4">
                    <div className="relative rounded-md shadow-sm mb-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={handleSearch} // Sử dụng handleSearch
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto border rounded-md">
                        {/* Left Column - Danh sách cuộc trò chuyện */}
                        <div className="p-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Chọn</h3>
                            {loading ? (
                                <div className="text-center text-gray-500">Đang tải...</div>
                            ) : error ? (
                                <div className="text-center text-red-500">{error}</div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center text-gray-500">Không có cuộc trò chuyện nào phù hợp.</div>
                            ) : (
                                <ul className="overflow-y-auto">
                                    {filteredConversations.map((conversation) => (
                                        <li
                                            key={conversation._id}
                                            className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer ${
                                                selectedConversations.includes(conversation._id) ? "bg-indigo-100" : ""
                                            }`}
                                            onClick={() => handleSelectConversation(conversation._id)}
                                        >
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                                                {getConversationImage(conversation) ? (
                                                    <img
                                                        src={getConversationImage(conversation)}
                                                        alt={getConversationName(conversation)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : conversation.isGroup ? (
                                                    <FaUsers className="w-6 h-6 text-gray-500" />
                                                ) : (
                                                    <FaUser className="w-6 h-6 text-gray-500" />
                                                )}
                                                {selectedConversations.includes(conversation._id) && (
                                                    <div className="absolute top-0 right-0 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                                                        <FaCheck />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="ml-3 text-sm text-gray-700 flex-grow">{getConversationName(conversation)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Right Column - Danh sách đã chọn */}
                        <div className="p-2 border-l">
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Đã chọn</h3>
                            {selectedConversations.length === 0 ? (
                                <div className="text-gray-500">Chưa chọn.</div>
                            ) : (
                                <ul className="overflow-y-auto">
                                    {selectedConversations.map((convId) => {
                                        const conversation = conversations.find((c) => c._id === convId);
                                        if (!conversation) return null;
                                        return (
                                            <li key={convId} className="flex items-center py-2 px-3 bg-gray-100 rounded-md mb-1">
                                                <div className="relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                                                    {getConversationImage(conversation) ? (
                                                        <img
                                                            src={getConversationImage(conversation)}
                                                            alt={getConversationName(conversation)}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : conversation.isGroup ? (
                                                        <FaUsers className="w-4 h-4 text-gray-500" />
                                                    ) : (
                                                        <FaUser className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-700 flex-grow">{getConversationName(conversation)}</span>
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-700 focus:outline-none"
                                                    onClick={() => handleRemoveSelectedConversation(convId)}
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t">
                    <div className="text-sm text-gray-500 mb-1">Thêm ghi chú (tùy chọn)</div>
                    <div className="rounded-md shadow-sm mb-2">
                        <textarea
                            rows={2}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Nhập tin nhắn..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
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
                            disabled={loading || selectedConversations.length === 0}
                        >
                            {loading ? "Đang chia sẻ..." : "Chia sẻ"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;