import React, { useState, useEffect, useCallback } from "react";
import { AiOutlineCamera, AiOutlineSearch, AiOutlineClose } from "react-icons/ai";
import { Api_FriendRequest } from "../../../../../apis/api_friendRequest";
import { Api_Profile } from "../../../../../apis/api_profile";
import {
  onError,
  offError,
} from "../../../../../services/sockets/events/chatInfo";

const CreateGroupModal = ({
  isOpen,
  onClose,
  onGroupCreated,
  userId,
  socket,
  currentConversationParticipants = [],
}) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [defaultMembers, setDefaultMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Optimize handleContactSelect with useCallback
  const handleContactSelect = useCallback((contact) => {
    setSelectedContacts((prevContacts) => {
      if (prevContacts.some((c) => c.id === contact.id)) {
        return prevContacts.filter((c) => c.id !== contact.id);
      }
      return [...prevContacts, contact];
    });
  }, []);

  // Handle removing a selected contact
  const handleRemoveSelectedContact = useCallback((contactToRemove) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter((contact) => contact.id !== contactToRemove.id)
    );
  }, []);

  // Fetch friends list and default members when modal opens
  useEffect(() => {
    if (!isOpen || !userId) {
      setContacts([]);
      setDefaultMembers([]);
      setSelectedContacts([]);
      setSearchQuery("");
      setGroupName("");
      setError(null);
      setRetryCount(0);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch current user's profile
        const userResponse = await Api_Profile.getProfile(userId);
        const userData = userResponse?.data?.user;
        if (!userData) {
          throw new Error("Không thể tải thông tin người dùng.");
        }

        // Fetch friends list
        const friendsResponse = await Api_FriendRequest.getFriendsList(userId);
        const friendsList = Array.isArray(friendsResponse.data)
          ? friendsResponse.data
          : [];

        const formattedContacts = friendsList
          .filter(
            (friend) =>
              friend._id !== userId &&
              !currentConversationParticipants.includes(friend._id)
          )
          .map((friend) => ({
            id: friend._id,
            name: friend.name || `${friend.firstname || ""} ${friend.surname || ""}`.trim() || "Không tên",
            avatar:
              friend.avatar ||
              "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
          }));

        // Create default members list (current user + currentConversationParticipants)
        const defaultMembersList = [
          {
            id: userId,
            name:
              userData.name ||
              `${userData.firstname || ""} ${userData.surname || ""}`.trim() ||
              "Bạn",
            avatar:
              userData.avatar ||
              "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
          },
        ];

        for (const participantId of currentConversationParticipants) {
          if (participantId !== userId) {
            try {
              const participantResponse = await Api_Profile.getProfile(participantId);
              const participantData = participantResponse?.data?.user;
              defaultMembersList.push({
                id: participantId,
                name:
                  participantData?.name ||
                  `${participantData?.firstname || ""} ${participantData?.surname || ""}`.trim() ||
                  "Không xác định",
                avatar:
                  participantData?.avatar ||
                  "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
              });
            } catch (err) {
              console.error(`Lỗi khi lấy thông tin người dùng ${participantId}:`, err);
              defaultMembersList.push({
                id: participantId,
                name: "Không xác định",
                avatar: "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
              });
            }
          }
        }

        setDefaultMembers(defaultMembersList);
        setContacts(formattedContacts);
        setRetryCount(0);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchData(), 2000); // Retry after 2 seconds
        } else {
          setError("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId, currentConversationParticipants, retryCount]);

  // Listen for Socket.IO errors
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleSocketError = (error) => {
      console.log("Socket error received:", error);
      setError(error.message || "Có lỗi xảy ra khi tạo nhóm.");
      setCreateLoading(false);
    };

    onError(socket, handleSocketError);

    return () => {
      offError(socket);
    };
  }, [socket, isOpen]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create group using Socket.IO
  const handleCreateGroup = async () => {
    const allParticipants = [...defaultMembers, ...selectedContacts];

    if (allParticipants.length < 3) {
      setError("Nhóm phải có ít nhất 3 thành viên (bao gồm bạn).");
      return;
    }

    if (!socket) {
      setError("Không có kết nối với server. Vui lòng thử lại.");
      setCreateLoading(false);
      return;
    }

    setCreateLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Generate default group name if not provided
    let actualGroupName = groupName.trim();
    if (!actualGroupName) {
      try {
        const creatorProfile = await Api_Profile.getProfile(userId);
        const creatorName = creatorProfile?.data?.user
          ? `${creatorProfile.data.user.firstname || ""} ${creatorProfile.data.user.surname || ""}`.trim()
          : "Bạn";
        const memberNames = [
          creatorName,
          ...allParticipants
            .filter((contact) => contact.id !== userId)
            .map((contact) => contact.name),
        ];
        actualGroupName = memberNames.join(", ");
        if (actualGroupName.length > 100) {
          actualGroupName = actualGroupName.substring(0, 97) + "...";
        }
      } catch (err) {
        console.error("Lỗi khi lấy profile người tạo:", err);
        actualGroupName = "Nhóm không tên";
      }
    }

    const participants = allParticipants.map((contact) => ({
      userId: contact.id,
      role: contact.id === userId ? "admin" : "member",
    }));

    const groupData = {
      name: actualGroupName,
      participants,
      isGroup: true,
      imageGroup:
        "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=",
      mute: null,
      isHidden: false,
      isPinned: false,
      pin: null,
    };

    const timeout = setTimeout(() => {
      setError("Tạo nhóm thất bại: Server không phản hồi.");
      setCreateLoading(false);
    }, 5000);

    socket.emit("createConversation", groupData, (response) => {
      clearTimeout(timeout);
      console.log("Create conversation response:", response);
      try {
        if (response && response.success) {
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
          setSuccessMessage("Tạo nhóm thành công!");
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 1500);
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
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tạo nhóm</h2>
          <button
            onClick={() => {
              console.log("Close button clicked");
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
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
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-grow max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Danh sách bạn bè</h3>
              {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {!loading && !error && filteredContacts.length === 0 && (
                <p className="text-sm text-gray-500">Không tìm thấy bạn bè.</p>
              )}
              {!loading &&
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center py-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-500 mr-2"
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
                Thành viên ({allParticipants.length}/100)
              </h3>
              {defaultMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center bg-gray-100 rounded-md p-1 mb-1"
                >
                  <span className="text-sm text-gray-700 flex-grow">
                    {member.id === userId ? `${member.name} (Bạn)` : member.name}
                  </span>
                </div>
              ))}
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center bg-gray-100 rounded-md p-1 mb-1"
                >
                  <span className="text-sm text-gray-700 flex-grow">{contact.name}</span>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleRemoveSelectedContact(contact)}
                  >
                    <AiOutlineClose size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {successMessage && (
            <p className="text-green-500 text-sm mt-2">{successMessage}</p>
          )}
        </div>
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={() => {
              console.log("Cancel button clicked");
              onClose();
            }}
            className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateGroup}
            className={`px-4 py-2 ml-2 rounded-md ${
              createLoading || allParticipants.length < 3
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            disabled={createLoading || allParticipants.length < 3}
          >
            {createLoading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;