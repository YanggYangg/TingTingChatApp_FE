import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes, FaCamera } from "react-icons/fa";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import {
  onError,
  offError,
} from "../../services/sockets/events/chatInfo"; // Adjust path as needed

const CreateGroup = ({ isOpen, onClose, onGroupCreated, userId, socket }) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch friends list when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await Api_FriendRequest.getFriendsList(userId);
        const friendsList = response.data || [];
        const formattedFriends = friendsList.map((friend) => ({
          id: friend._id,
          name: friend.name,
          avatar: friend.avatar || "https://via.placeholder.com/40?text=User",
        }));
        setFriends(formattedFriends);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isOpen, userId]);

  // Handle socket errors
  useEffect(() => {
    if (!socket || !isOpen) return;

    onError(socket, (err) => {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setCreateLoading(false);
    });

    return () => {
      offError(socket);
    };
  }, [socket, isOpen]);

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle friend selection
  const handleSelectFriend = (friend) => {
    setSelectedFriends((prev) =>
      prev.some((f) => f.id === friend.id)
        ? prev.filter((f) => f.id !== friend.id)
        : [...prev, friend]
    );
  };

  // Handle removing a selected friend
  const handleRemoveFriend = (friendId) => {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  // Handle group creation
  const handleCreateGroup = () => {
    if (selectedFriends.length < 2) {
      setError("Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.");
      return;
    }

    if (!socket) {
      setError("Không có kết nối mạng. Vui lòng thử lại.");
      return;
    }

    setCreateLoading(true);
    setError(null);

    const groupData = {
      name: groupName.trim() || "Nhóm không tên",
      participants: [
        { userId, role: "admin" },
        ...selectedFriends.map((friend) => ({
          userId: friend.id,
          role: "member",
        })),
      ],
      isGroup: true,
      imageGroup: "https://via.placeholder.com/40?text=Group", // Default group image
      mute: null,
      isHidden: false,
      isPinned: false,
      pin: "null",
    };

    socket.emit("createConversation", groupData, (response) => {
      if (response && response.success) {
        alert("Tạo nhóm thành công!");
        if (onGroupCreated) {
          onGroupCreated(response.data);
        }
        setGroupName("");
        setSelectedFriends([]);
        onClose();
      } else {
        setError(response?.message || "Không thể tạo nhóm. Vui lòng thử lại.");
      }
      setCreateLoading(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Tạo nhóm</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <FaCamera className="text-gray-500" size={18} />
          </div>
          <input
            type="text"
            placeholder="Nhập tên nhóm..."
            className="flex-grow border-b border-gray-300 py-1 text-gray-700 focus:outline-none"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* Search Friends */}
        <div className="relative mb-4">
          <FaSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Friends List and Selected Friends */}
        <div className="flex space-x-4 mb-4">
          {/* Friends List */}
          <div className="w-1/2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Danh sách bạn bè</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {loading && <p className="text-gray-500 text-sm">Đang tải...</p>}
              {error && !loading && <p className="text-red-500 text-sm">{error}</p>}
              {!loading && filteredFriends.length === 0 && (
                <p className="text-gray-500 text-sm">Không tìm thấy bạn bè.</p>
              )}
              {!loading &&
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => handleSelectFriend(friend)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.some((f) => f.id === friend.id)}
                      onChange={() => handleSelectFriend(friend)}
                      className="h-4 w-4 text-blue-500"
                    />
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-700">{friend.name}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Friends */}
          <div className="w-1/2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Đã chọn ({selectedFriends.length}/100)
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedFriends.length === 0 && (
                <p className="text-gray-500 text-sm">Chưa chọn bạn bè nào.</p>
              )}
              {selectedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between bg-gray-100 rounded-full px-3 py-1"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-700">{friend.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateGroup}
            className={`px-4 py-2 rounded text-white ${
              createLoading || selectedFriends.length < 2
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={createLoading || selectedFriends.length < 2}
          >
            {createLoading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;