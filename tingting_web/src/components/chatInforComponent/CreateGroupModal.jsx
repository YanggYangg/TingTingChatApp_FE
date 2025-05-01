import React, { useState, useEffect, useCallback } from "react";
import { AiOutlineCamera, AiOutlineSearch, AiOutlineClose } from "react-icons/ai";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import { Api_Profile } from "../../../apis/api_profile";
import {
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";

const CreateGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
  userId,
  socket,
  currentConversationParticipants,
}) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Hàm lấy danh sách bạn bè từ API REST
  const getFriendsList = async (userId) => {
    return Api_FriendRequest.getFriendsList(userId);
  };

  // Tối ưu hóa handleContactSelect với useCallback
  const handleContactSelect = useCallback((contact) => {
    setSelectedContacts((prevContacts) => {
      if (prevContacts.some((c) => c.id === contact.id)) {
        return prevContacts.filter((c) => c.id !== contact.id);
      }
      return [...prevContacts, contact];
    });
  }, []);

  // Xử lý bỏ chọn liên hệ
  const handleRemoveSelectedContact = useCallback((contactToRemove) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter((contact) => contact.id !== contactToRemove.id)
    );
  }, []);

  // Gọi API khi modal mở để lấy danh sách bạn bè và tích chọn sẵn người dùng khác
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchFriendsList = async () => {
      setLoading(true);
      setError(null);
      setSelectedContacts([]);

      try {
        const response = await getFriendsList(userId);
        const friendsList = response.data || [];
        const formattedContacts = friendsList.map((friend) => ({
          id: friend._id,
          name: friend.name,
          avatar: friend.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
        }));
        setContacts(formattedContacts);

        const otherUserId = currentConversationParticipants.find((id) => id !== userId);
        if (otherUserId) {
          try {
            const profileResponse = await Api_Profile.getProfile(otherUserId);
            const otherUser = profileResponse?.data?.user;
            if (otherUser) {
              const otherContact = {
                id: otherUser._id,
                name: `${otherUser.firstname} ${otherUser.surname}`.trim(),
                avatar: otherUser.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
              };
              if (formattedContacts.some((contact) => contact.id === otherUserId)) {
                setSelectedContacts([otherContact]);
              }
            }
          } catch (err) {
            console.error("Lỗi khi lấy thông tin người dùng khác:", err);
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách bạn bè:", err);
        setError("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsList();
  }, [isOpen, userId]);

  // Lắng nghe lỗi từ Socket.IO
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleSocketError = (error) => {
      console.log("Socket error received:", error);
      setError(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setCreateLoading(false);
    };

    onError(socket, handleSocketError);

    return () => {
      offError(socket);
    };
  }, [socket, isOpen]);

  // Lọc danh sách liên hệ dựa trên tìm kiếm
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Hàm tạo nhóm sử dụng Socket.IO
  const handleCreateGroup = async () => {
    if (selectedContacts.length < 2) {
      setError("Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.");
      return;
    }

    if (!socket) {
      setError("Không có kết nối Socket.IO. Vui lòng thử lại.");
      setCreateLoading(false);
      return;
    }

    setCreateLoading(true);
    setError(null);

    // Tạo tên nhóm mặc định nếu không nhập
    let actualGroupName = groupName.trim();
    if (!actualGroupName) {
      try {
        const creatorProfile = await Api_Profile.getProfile(userId);
        const creatorName = creatorProfile?.data?.user
          ? `${creatorProfile.data.user.firstname} ${creatorProfile.data.user.surname}`.trim()
          : "Bạn";
        const memberNames = [creatorName, ...selectedContacts.map((contact) => contact.name)];
        actualGroupName = memberNames.join(", ");
        if (actualGroupName.length > 100) {
          actualGroupName = actualGroupName.substring(0, 97) + "...";
        }
      } catch (err) {
        console.error("Lỗi khi lấy profile người tạo:", err);
        actualGroupName = "Nhóm không tên";
      }
    }

    const participants = [
      { userId: userId, role: "admin" },
      ...selectedContacts.map((contact) => ({
        userId: contact.id,
        role: "member",
      })),
    ];

    const groupData = {
      name: actualGroupName,
      participants,
      isGroup: true,
      imageGroup:
        "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=",
      mute: null,
      isHidden: false,
      isPinned: false,
      pin: "null",
    };

    // Thêm timeout cho socket.emit
    const timeout = setTimeout(() => {
      setError("Tạo nhóm thất bại: Server không phản hồi.");
      setCreateLoading(false);
    }, 5000);

    socket.emit("createConversation", groupData, (response) => {
      clearTimeout(timeout);
      console.log("Create conversation response:", response);
      try {
        if (response && response.success) {
          // Hiển thị toast tùy chỉnh
          if (typeof window.showToast === "function") {
            window.showToast("Tạo nhóm thành công!", "success");
          } else {
            console.warn("window.showToast is not defined, falling back to alert");
            alert("Tạo nhóm thành công!");
          }

          setGroupName("");
          setSelectedContacts([]);
          if (onGroupCreated) {
            onGroupCreated(response.data);
          }
          console.log("Calling onClose");
          onClose();
        } else {
          setError(response?.message || "Không thể tạo nhóm.");
        }
      } catch (err) {
        console.error("Error in socket callback:", err);
        setError("Lỗi không xác định khi tạo nhóm.");
      } finally {
        setCreateLoading(false);
      }
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tạo nhóm</h2>
          <button
            onClick={() => {
              console.log("Close button clicked");
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center border rounded-md p-2 mb-4">
            <AiOutlineCamera className="text-gray-500 mr-2" />
            <input
              type="text"
              className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
              placeholder="Nhập tên nhóm (tùy chọn)..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-md p-2 mb-4">
            <AiOutlineSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
              placeholder="Nhập tên hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-grow max-h-64 overflow-y-auto pr-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Danh sách bạn bè</h3>
              {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {!loading && !error && filteredContacts.length === 0 && (
                <p className="text-sm text-gray-500">Không tìm thấy bạn bè nào.</p>
              )}
              {!loading &&
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center py-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-500 focus:ring-blue-500 mr-2"
                      checked={selectedContacts.some((c) => c.id === contact.id)}
                      onChange={() => handleContactSelect(contact)}
                    />
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-6 h-6 rounded-full mr-2 object-cover"
                    />
                    <span className="text-sm text-gray-700">{contact.name}</span>
                  </div>
                ))}
            </div>
            <div className="w-48 max-h-64 overflow-y-auto border rounded-md p-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Đã chọn {selectedContacts.length}/100
              </h3>
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center bg-gray-100 rounded-md p-1 mb-1"
                >
                  <span className="text-sm text-gray-700 flex-grow">{contact.name}</span>
                  <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => handleRemoveSelectedContact(contact)}
                  >
                    <AiOutlineClose size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={() => {
              console.log("Cancel button clicked");
              onClose();
            }}
            className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateGroup}
            className={`px-4 py-2 rounded-md focus:outline-none ml-2 ${
              createLoading || selectedContacts.length < 2
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            disabled={createLoading || selectedContacts.length < 2}
          >
            {createLoading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;