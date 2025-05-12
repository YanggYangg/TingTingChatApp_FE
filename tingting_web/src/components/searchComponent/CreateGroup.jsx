import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes, FaCamera } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import { onError, offError } from "../../services/sockets/events/chatInfo";
import { toast } from "react-toastify";

const CreateGroup = ({ isOpen, onClose, onGroupCreated, userId, socket }) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Cache profile
  const profileCache = new Map();

  // Hàm lấy profile với cache
  const getCachedProfile = async (userId) => {
    if (profileCache.has(userId)) {
      const cached = profileCache.get(userId);
      if (cached) return cached;
    }
    try {
      console.log(`Calling Api_Profile.getProfile for userId: ${userId}`);
      const response = await Api_Profile.getProfile(userId);
      console.log("Profile response:", response);
      const user = response?.user || response?.data?.user || response?.data?.profile || response?.data;
      if (user && (user.firstname || user.name)) {
        profileCache.set(userId, user);
        return user;
      } else {
        console.warn(`Invalid profile data for user ${userId}:`, user);
        return null;
      }
    } catch (err) {
      console.error(`Lỗi khi lấy profile cho user ${userId}:`, err);
      return null;
    }
  };

  // Fetch friends list when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching friends for userId: ${userId}`);
        const response = await Api_FriendRequest.getFriendsList(userId);
        console.log("Friends list response:", response);
        const friendsList = response.data || [];
        const uniqueFriends = Array.from(
          new Map(friendsList.map((friend) => [friend._id, friend])).values()
        );
        console.log("Unique friends:", uniqueFriends);
        const formattedFriends = uniqueFriends.map((friend) => ({
          id: friend._id,
          name: friend.name || "Unknown",
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

    const handleSocketError = (err) => {
      console.log("Socket error received:", err);
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setCreateLoading(false);
      toast.error(err.message || "Có lỗi xảy ra. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 3000,
        toastId: "create-group-error",
      });
    };

    onError(socket, handleSocketError);

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
  const handleCreateGroup = async () => {
    if (selectedFriends.length < 2) {
      setError("Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.");
      toast.error("Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.", {
        position: "top-right",
        autoClose: 3000,
        toastId: "create-group-error",
      });
      return;
    }

    if (!socket) {
      setError("Không có kết nối mạng. Vui lòng thử lại.");
      setCreateLoading(false);
      toast.error("Không có kết nối mạng. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 3000,
        toastId: "create-group-error",
      });
      return;
    }

    setCreateLoading(true);
    setError(null);

    // Tạo tên nhóm mặc định nếu không nhập
    let actualGroupName = groupName.trim();
    if (!actualGroupName) {
      try {
        const creator = await getCachedProfile(userId);
        console.log("Creator profile:", creator);
        const creatorName = creator
          ? `${creator.firstname || ""} ${creator.surname || creator.name || ""}`.trim() || "Bạn"
          : "Bạn";
        const memberNames = [creatorName, ...selectedFriends.map((friend) => friend.name)];
        actualGroupName = memberNames.join(", ");
        if (actualGroupName.length > 100) {
          actualGroupName = actualGroupName.substring(0, 97) + "...";
        }
        console.log("Generated group name:", actualGroupName);
      } catch (err) {
        console.error("Lỗi khi tạo tên nhóm mặc định:", err);
        actualGroupName = "Nhóm không tên";
      }
    }

    const groupData = {
      name: actualGroupName,
      participants: [
        { userId: userId.toString(), role: "admin" },
        ...selectedFriends.map((friend) => ({
          userId: friend.id.toString(),
          role: "member",
        })),
      ],
      isGroup: true,
      imageGroup:
        "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=",
      mute: null,
      isHidden: false,
      isPinned: false,
      pin: "null",
    };

    console.log("Group data to send:", groupData);

    // Thêm timeout cho socket.emit
    const timeout = setTimeout(() => {
      setError("Tạo nhóm thất bại: Server không phản hồi.");
      setCreateLoading(false);
      toast.error("Tạo nhóm thất bại: Server không phản hồi.", {
        position: "top-right",
        autoClose: 3000,
        toastId: "create-group-error",
      });
    }, 10000);

    socket.emit("createConversation", groupData, (response) => {
      clearTimeout(timeout);
      console.log("Create conversation response:", response);
      try {
        if (response && response.success) {
          toast.success("Tạo nhóm thành công!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: "bg-green-500 text-white rounded-lg shadow-lg p-4",
            progressClassName: "bg-white",
            theme: "light",
            toastId: "create-group-success",
          });

          if (onGroupCreated) {
            console.log("Calling onGroupCreated with:", response.data);
            onGroupCreated(response.data);
          }
          setGroupName("");
          setSelectedFriends([]);
          console.log("Calling onClose");
          onClose();
        } else {
          const errorMessage = response?.message || "Không thể tạo nhóm. Vui lòng thử lại.";
          setError(errorMessage);
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 3000,
            toastId: "create-group-error",
          });
        }
      } catch (err) {
        console.error("Error in socket callback:", err);
        setError("Lỗi không xác định khi tạo nhóm.");
        toast.error("Lỗi không xác định khi tạo nhóm.", {
          position: "top-right",
          autoClose: 3000,
          toastId: "create-group-error",
        });
      } finally {
        setCreateLoading(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Tạo nhóm</h2>
          <button
            onClick={() => {
              console.log("Close button clicked");
              onClose();
            }}
            className="text-gray-500 hover:text-black text-xl"
          >
            <FaTimes />
          </button>
        </div>
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
        <div className="flex space-x-4 mb-4">
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
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              console.log("Cancel button clicked");
              onClose();
            }}
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