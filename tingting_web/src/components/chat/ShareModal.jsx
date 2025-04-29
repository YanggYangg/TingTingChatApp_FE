import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaTimes, FaSearch, FaUsers, FaUser, FaCheck, FaTrash } from "react-icons/fa";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../apis/api_profile";
import { initSocket } from "../../services/sockets/index.js";

const ShareModal = ({ isOpen, onClose, onShare, messageToForward, userId, messageId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [socket, setSocket] = useState(null);

  // Khởi tạo Socket.IO
  useEffect(() => {
    if (!userId) return;

    const newSocket = initSocket(userId);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  // Lấy danh sách cuộc trò chuyện
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      const abortController = new AbortController();

      try {
        const response = await Api_chatInfo.getConversationById(userId, {
          signal: abortController.signal,
        });
        const convData = Array.isArray(response) ? response : response?.data || [];
        setConversations(convData);

        // Lấy thông tin người dùng cho các cuộc trò chuyện 1-1
        const userIds = new Set();
        convData.forEach((conv) => {
          if (!conv.isGroup) {
            const otherParticipant = conv.participants.find(
              (p) => p.userId !== userId
            );
            if (otherParticipant) userIds.add(otherParticipant.userId);
          }
        });

        const userPromises = Array.from(userIds).map(async (id) => {
          try {
            const userResponse = await Api_Profile.getProfile(id, {
              signal: abortController.signal,
            });
            return {
              id,
              firstname:
                userResponse?.data?.user?.firstname +
                " " +
                userResponse?.data?.user?.surname,
            };
          } catch (err) {
            return { id, firstname: "Người dùng không xác định" };
          }
        });

        const users = await Promise.all(userPromises);
        setUserCache(users.reduce((acc, user) => {
          acc[user.id] = user.firstname;
          return acc;
        }, {}));
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }

      return () => abortController.abort();
    };

    fetchConversations();
  }, [isOpen, userId]);

  // Lắng nghe sự kiện từ Socket.IO để cập nhật danh sách cuộc trò chuyện
  useEffect(() => {
    if (!socket || !userId) return;

    socket.on("conversationUpdated", (data) => {
      setConversations((prev) => {
        const updatedConversations = prev.map((conv) =>
          conv._id === data.conversationId ? { ...conv, ...data } : conv
        );
        return updatedConversations;
      });
    });

    return () => {
      socket.off("conversationUpdated");
    };
  }, [socket, userId]);

  // Xử lý tìm kiếm với useCallback
  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Lọc danh sách cuộc trò chuyện với useMemo
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const name = getConversationName(conv).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
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
      setError("Vui lòng chọn ít nhất một cuộc trò chuyện để chia sẻ.");
      return;
    }

    if (!userId || !messageId) {
      setError("Thiếu thông tin để chuyển tiếp tin nhắn.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        messageId: messageId,
        targetConversationIds: selectedConversations,
        userId,
        content: content.trim() || undefined,
      };

      const response = await Api_chatInfo.forwardMessage(data);
      if (Array.isArray(response)) {
        socket.emit("forwardMessage", {
          targetConversationIds: selectedConversations,
          messageId,
          userId,
          content: content.trim() || undefined,
        });
        onShare(selectedConversations, content);
        onClose();
      }
    } catch (err) {
      setError("Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    if (!conversation.isGroup && conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId
      );
      return userCache[otherParticipant?.userId] || "Người dùng không xác định";
    }
    return "Cuộc trò chuyện không tên";
  };

  const getConversationImage = (conversation) => {
    if (conversation.imageGroup) return conversation.imageGroup;
    return null;
  };

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setSelectedConversations([]);
      setContent("");
      setSearchTerm("");
      setError(null);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chia sẻ</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
            disabled={loading}
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="relative rounded-md shadow-sm mb-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={handleSearch}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto border rounded-md">
            {/* Danh sách cuộc trò chuyện */}
            <div className="p-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Chọn</h3>
              {loading ? (
                <div className="text-center text-gray-500">Đang tải...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-gray-500">
                  Không có cuộc trò chuyện nào phù hợp.
                </div>
              ) : (
                <ul className="overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <li
                      key={conversation._id}
                      className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer ${
                        selectedConversations.includes(conversation._id)
                          ? "bg-indigo-100"
                          : ""
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
                      <span className="ml-3 text-sm text-gray-700 flex-grow">
                        {getConversationName(conversation)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Danh sách đã chọn */}
            <div className="p-2 border-l">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Đã chọn</h3>
              {selectedConversations.length === 0 ? (
                <div className="text-gray-500">Chưa chọn.</div>
              ) : (
                <ul className="overflow-y-auto">
                  {selectedConversations.map((convId) => {
                    const conversation = conversations.find(
                      (c) => c._id === convId
                    );
                    if (!conversation) return null;
                    return (
                      <li
                        key={convId}
                        className="flex items-center py-2 px-3 bg-gray-100 rounded-md mb-1"
                      >
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
                        <span className="ml-2 text-sm text-gray-700 flex-grow">
                          {getConversationName(conversation)}
                        </span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() =>
                            handleRemoveSelectedConversation(convId)
                          }
                          disabled={loading}
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
              disabled={loading}
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
              className={`ml-3 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading || selectedConversations.length === 0
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
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