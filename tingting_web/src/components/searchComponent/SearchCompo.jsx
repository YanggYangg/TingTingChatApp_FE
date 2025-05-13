import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaSearch, FaUserFriends, FaUsers, FaCamera } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import CreateGroup from "./CreateGroup";
import { useSocket } from "../../contexts/SocketContext";
import { loadAndListenConversations } from "../../services/sockets/events/conversation";

function Search({ onGroupCreated, onSearchResults }) {
  const [isModalFriendsOpen, setIsModalFriendsOpen] = useState(false);
  const [isModalCreateGroupOpen, setIsModalCreateGroupOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [userCache, setUserCache] = useState({});
  const inputRef = useRef(null);

  const { socket } = useSocket();
  const userId = localStorage.getItem("userId");

  // Toggle modal tìm kiếm bạn bè
  const toggleFriendsModal = () => {
    setIsModalFriendsOpen(!isModalFriendsOpen);
    setSearchValue("");
    setFilteredUsers([]);
    setSelectedUser(null);
  };

  // Toggle modal tạo nhóm
  const toggleCreateGroupModal = () => {
    setIsModalCreateGroupOpen(!isModalCreateGroupOpen);
  };

  // Xử lý khi chọn người dùng
  const handleSelectUser = (user) => {
    console.log("Search: User selected:", user);
    setSelectedUser(user);
  };

  // Xử lý khi nhóm được tạo
  const handleGroupCreated = (groupData) => {
    console.log("Search: Group created:", groupData);
    onGroupCreated(groupData);
  };

  // Tải danh sách người dùng và cập nhật userCache
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await Api_Profile.getProfiles();
        console.log("Search: Dữ liệu người dùng từ API:", response.data);
        if (Array.isArray(response.data.users)) {
          setAllUsers(response.data.users);
          const newCache = {};
          response.data.users.forEach((user) => {
            newCache[user._id] = {
              name: `${user.firstname || ""} ${user.surname || ""}`.trim() || user._id,
              avatar: user.avatar || "https://via.placeholder.com/150",
            };
          });
          setUserCache(newCache);
          console.log("Search: Cập nhật userCache:", newCache);
        } else {
          console.error("Search: Dữ liệu người dùng không phải mảng:", response.data.users);
        }
      } catch (error) {
        console.error("Search: Lỗi khi lấy danh sách người dùng:", error);
      }
    };

    fetchUsers();
  }, []);

  // Tải danh sách hội thoại
  useEffect(() => {
    if (!socket || !userId) {
      console.warn("Search: Thiếu socket hoặc userId", { socket, userId });
      return;
    }

    const handleConversations = (conversationsData) => {
      console.log("Search: Nhận danh sách hội thoại:", conversationsData);
      setConversations(conversationsData || []);
    };

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);

    return () => {
      cleanupLoad();
    };
  }, [socket, userId]);

  // Tải danh sách lời mời kết bạn
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.warn("Search: Thiếu userId");
          return;
        }

        const [sentRes, receivedRes] = await Promise.all([
          Api_FriendRequest.getSentRequests(userId),
          Api_FriendRequest.getReceivedRequests(userId),
        ]);

        const newRequestStatus = {};

        sentRes.data.forEach((req) => {
          if (req.recipient && req.recipient._id) {
            newRequestStatus[req.recipient._id] = {
              status: req.status,
              requestId: req._id,
              isRequester: true,
            };
          } else {
            console.warn("Search: Dữ liệu recipient bị thiếu:", req);
          }
        });

        receivedRes.data.forEach((req) => {
          if (req.requester && req.requester._id) {
            newRequestStatus[req.requester._id] = {
              status: req.status,
              requestId: req._id,
              isRequester: false,
            };
          } else {
            console.warn("Search: Dữ liệu requester bị thiếu:", req);
          }
        });

        setFriendRequests(newRequestStatus);
        console.log("Search: Cập nhật friendRequests:", newRequestStatus);
      } catch (error) {
        console.error("Search: Lỗi khi lấy danh sách lời mời:", error);
      }
    };

    fetchFriendRequests();
  }, [refreshTrigger]);

  // Lọc kết quả tìm kiếm hội thoại
  const searchResults = useMemo(() => {
    if (!searchValue.trim()) {
      console.log("Search: SearchValue rỗng, trả về mảng rỗng");
      return [];
    }

    const searchQuery = searchValue.toLowerCase();
    console.log("Search: Bắt đầu lọc hội thoại với searchQuery:", searchQuery);

    const filteredConversations = conversations.filter((conv) => {
      try {
        if (conv.isGroup) {
          const matches = conv.name?.toLowerCase().includes(searchQuery);
          console.log(`Search: Kiểm tra nhóm ${conv.name}:`, matches);
          return matches;
        } else {
          const otherParticipant = conv.participants?.find((p) => p.userId !== userId);
          if (otherParticipant) {
            const userName = userCache[otherParticipant.userId]?.name || otherParticipant.userId;
            const matches = userName.toLowerCase().includes(searchQuery);
            console.log(`Search: Kiểm tra hội thoại 1:1 với ${userName}:`, matches);
            return matches;
          }
          console.warn("Search: Không tìm thấy otherParticipant trong hội thoại:", conv);
          return false;
        }
      } catch (error) {
        console.error("Search: Lỗi khi lọc hội thoại:", conv, error);
        return false;
      }
    });

    const results = filteredConversations.map((conv) => {
      const otherParticipant = conv.participants?.find((p) => p.userId !== userId);
      return {
        id: conv._id,
        name: conv.isGroup
          ? conv.name
          : userCache[otherParticipant?.userId]?.name || otherParticipant?.userId || "Unknown",
        avatar:
          conv.imageGroup ||
          userCache[otherParticipant?.userId]?.avatar ||
          "https://via.placeholder.com/150",
        isHidden: conv.participants?.find((p) => p.userId === userId)?.isHidden || false,
        participants: conv.participants || [],
        isGroup: conv.isGroup || false,
        imageGroup: conv.imageGroup,
        lastMessage: conv.lastMessage?.content || "",
        lastMessageType: conv.lastMessage?.messageType || "text",
        lastMessageSenderId: conv.lastMessage?.userId || null,
        time: conv.lastMessage
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        updateAt: conv.lastMessage?.createdAt || conv.updatedAt,
        isPinned: conv.participants?.find((p) => p.userId === userId)?.isPinned || false,
      };
    });

    console.log("Search: Kết quả tìm kiếm hội thoại:", results);
    return results;
  }, [searchValue, conversations, userId, userCache]);

  // Truyền kết quả tìm kiếm
  useEffect(() => {
    onSearchResults(searchResults);
  }, [searchResults, onSearchResults]);

  // Lọc người dùng cho modal thêm bạn
  useEffect(() => {
    if (!isModalFriendsOpen || !searchValue.trim()) {
      setFilteredUsers([]);
      return;
    }

    const searchQuery = searchValue.toLowerCase();
    const filtered = allUsers.filter(
      (user) =>
        user.phone.includes(searchQuery) ||
        `${user.firstname || ""} ${user.surname || ""}`.toLowerCase().includes(searchQuery)
    );
    setFilteredUsers(filtered);
    console.log("Search: Kết quả lọc người dùng cho modal:", filtered);
  }, [searchValue, isModalFriendsOpen, allUsers]);

  // Xử lý gửi/thu hồi lời mời kết bạn
  const handleFriendRequest = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !selectedUser || !selectedUser._id) {
      console.warn("Search: Thiếu thông tin để gửi/thu hồi lời mời:", { userId, selectedUser });
      return;
    }

    const existingRequest = friendRequests[selectedUser._id];

    try {
      const userPhoneRes = await Api_Profile.getUserPhone(userId);
      const currentUserPhone = userPhoneRes.phone;

      if (existingRequest && existingRequest.status === "pending" && existingRequest.isRequester) {
        await Api_FriendRequest.cancelFriendRequest({
          requesterId: userId,
          recipientId: selectedUser._id,
        });

        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });
        console.log("Search: Đã thu hồi lời mời kết bạn với:", selectedUser._id);
      } else {
        await Api_FriendRequest.sendFriendRequest({
          requesterPhone: currentUserPhone,
          recipientPhone: selectedUser.phone,
        });

        setFriendRequests((prev) => ({
          ...prev,
          [selectedUser._id]: {
            status: "pending",
            requestId: "temp",
            isRequester: true,
          },
        }));
        console.log("Search: Đã gửi lời mời kết bạn tới:", selectedUser._id);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Search: Lỗi xử lý lời mời kết bạn:", err);
    }
  };

  // Xử lý phản hồi lời mời kết bạn
  const handleRespondRequest = async (requestId, action) => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await Api_FriendRequest.respondToFriendRequest({
        requestId,
        action,
        userId,
      });

      if (action === "accepted") {
        setFriendRequests((prev) => ({
          ...prev,
          [selectedUser._id]: {
            status: "accepted",
            requestId,
            isRequester: false,
          },
        }));
        console.log("Search: Đã chấp nhận lời mời kết bạn từ:", selectedUser._id);
      } else if (action === "rejected") {
        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });
        setSelectedUser((prevUser) => ({ ...prevUser }));
        console.log("Search: Đã từ chối lời mời kết bạn từ:", selectedUser._id);
      }

      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 100);
    } catch (err) {
      console.error("Search: Lỗi khi phản hồi lời mời kết bạn:", err);
    }
  };

  return (
    <div className="flex items-center bg-gray-200 px-3 py-2 rounded-full w-full relative">
      <FaSearch
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
        size={16}
      />
      <input
        type="text"
        placeholder="Tìm kiếm"
        className="bg-transparent text-gray-700 placeholder-gray-500 pl-10 pr-2 py-1 flex-grow focus:outline-none"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        ref={inputRef}
      />

      <FaUserFriends
        className="text-gray-500 mx-2 cursor-pointer"
        size={20}
        onClick={toggleFriendsModal}
      />
      <FaUsers
        className="text-gray-500 mx-2 cursor-pointer"
        size={20}
        onClick={toggleCreateGroupModal}
      />
     

      {/* Modal tìm kiếm bạn bè */}
      {isModalFriendsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Thêm bạn</h2>
              <button
                onClick={toggleFriendsModal}
                className="text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            <div className="relative mb-4">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <div className="flex items-center px-3 py-2 border-r border-gray-300 bg-gray-100">
                  <img
                    src="https://flagcdn.com/w40/vn.png"
                    alt="VN"
                    className="w-5 h-5 rounded-full mr-2"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Số điện thoại hoặc tên"
_ssl_mode: None
                  className="flex-grow px-4 py-2 text-gray-700 focus:outline-none"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
              {searchValue && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => handleSelectUser(user)}
                  >
                    <img
                      src={user.avatar || "https://via.placeholder.com/150"}
                      alt={user.firstname}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {`${user.firstname || ""} ${user.surname || ""}`.trim() || user._id}
                      </p>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    </div>
                  </div>
                ))
              ) : searchValue ? (
                <p className="text-gray-500">Không có kết quả tìm kiếm.</p>
              ) : (
                <p className="text-gray-500">Nhập số điện thoại hoặc tên để tìm bạn bè.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal thông tin người dùng */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-2 right-3 text-gray-600 text-xl"
            >
              ×
            </button>

            <div className="flex items-center mb-4">
              <img
                src={selectedUser.avatar || "https://via.placeholder.com/150"}
                alt={selectedUser.firstname}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {`${selectedUser.firstname || ""} ${user.surname || ""}`.trim() || selectedUser._id}
                </h2>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              {friendRequests[selectedUser._id] ? (
                friendRequests[selectedUser._id].status === "pending" ? (
                  friendRequests[selectedUser._id].isRequester ? (
                    <button
                      onClick={handleFriendRequest}
                      className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                      Thu hồi lời mời
                    </button>
                  ) : (
                    <>
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() =>
                          handleRespondRequest(
                            friendRequests[selectedUser._id].requestId,
                            "accepted"
                          )
                        }
                      >
                        Chấp nhận
                      </button>
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded"
                        onClick={() =>
                          handleRespondRequest(
                            friendRequests[selectedUser._id].requestId,
                            "rejected"
                          )
                        }
                      >
                        Từ chối
                      </button>
                    </>
                  )
                ) : friendRequests[selectedUser._id].status === "accepted" ? (
                  <button className="bg-green-500 text-white px-4 py-2 rounded">
                    Đã là bạn bè
                  </button>
                ) : null
              ) : (
                <button
                  onClick={handleFriendRequest}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Kết bạn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo nhóm */}
      <CreateGroup
        isOpen={isModalCreateGroupOpen}
        onClose={toggleCreateGroupModal}
        onGroupCreated={handleGroupCreated}
        userId={userId}
        socket={socket}
      />
    </div>
  );
}

export default Search;