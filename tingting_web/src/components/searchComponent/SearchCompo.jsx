import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaUserFriends, FaUsers, FaCamera } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import { Api_Conversation } from "../../../apis/Api_Conversation";
import CreateGroup from "./CreateGroup";
import { useSocket } from "../../contexts/SocketContext"; // Import socket from context or wherever it's defined
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setSelectedMessage } from "../../redux/slices/chatSlice";
import debounce from "lodash/debounce";
//socket
import socket1 from "../../utils/socket";
import PinVerificationModal from "../PinVerificationModal"; // Import modal xác thực PIN

function Search({ onGroupCreated }) {
  const [isModalFriendsOpen, setIsModalFriendsOpen] = useState(false);
  const [isModalCreateGroupOpen, setIsModalCreateGroupOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState({});
  const [targetUserId, setTargetUserId] = useState("id_user_being_viewed");
  //const [friendStatus, setFriendStatus] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [friendStatus, setFriendStatus] = useState("not_friends");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  //Input ngoai cung
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const [selectedHiddenConversation, setSelectedHiddenConversation] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket } = useSocket();
  // Xử lý click bên ngoài modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShowSearchModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTopSearch = async (keyword = phone) => {
    const normalizedKeyword = keyword.trim().toLowerCase(); // Chuẩn hóa từ khóa
    const userId = localStorage.getItem("userId");

    console.log("🔍 UserId:", userId, "Keyword:", normalizedKeyword);

    if (!normalizedKeyword) {
      if (searchResults.length > 0 || showSearchModal) {
        setSearchResults([]);
        setShowSearchModal(true);
      } else {
        toast.warning("Vui lòng nhập tên cuộc trò chuyện");
      }
      return;
    }

    if (!userId) {
      console.error("User ID không tồn tại");
      toast.error("Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      // Gọi API với từ khóa đã chuẩn hóa
      const res = await Api_Conversation.searchConversationsByUserId(
        userId,
        normalizedKeyword
      );
      const result = Array.isArray(res) ? res : [];

      console.log("Kết quả tìm kiếm input ngoài:", result);

      if (result.length > 0) {
        setSearchResults(result);
        setShowSearchModal(true);
      } else {
        setSearchResults([]);
        setShowSearchModal(true);
        toast.info("Không tìm thấy cuộc trò chuyện phù hợp.");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm conversation:", error.message);
      setSearchResults([]);
      setShowSearchModal(true);
      toast.error("Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.");
    }
  };

  // Debounce tìm kiếm thời gian thực
  const debouncedSearch = useCallback(
    debounce((keyword) => {
      if (keyword.trim()) {
        handleTopSearch(keyword);
      } else {
        setSearchResults([]);
        setShowSearchModal(true);
      }
    }, 300),
    []
  );

  const toggleFriendsModal = () => {
    setIsModalFriendsOpen(!isModalFriendsOpen);
    setSearchValue("");
    setFilteredResults([]);
    setSelectedUser(null);
  };

  // Toggle CreateGroup modal
  const toggleCreateGroupModal = () => {
    setIsModalCreateGroupOpen(!isModalCreateGroupOpen);
  };
  // Callback for when a group is created (optional)
  const handleGroupCreated = (groupData) => {
    console.log("Group created:", groupData);
    onGroupCreated(groupData); // Gọi prop để truyền nhóm mới lên ChatList
  };

  //socket
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) socket1.emit("add_user", userId);
    console.log("🔔 Đã kết nối với socket server:", userId);
  }, []);

  useEffect(() => {
    socket1.on("friend_request_received", ({ fromUserId }) => {
      console.log("📩 Nhận lời mời kết bạn từ:", fromUserId);

      // Cập nhật trạng thái trong state friendRequests
      setFriendRequests((prev) => ({
        ...prev,
        [fromUserId]: {
          status: "pending",
          isRequester: false,
          requestId: "temp", // có thể update bằng ID thực sau
        },
      }));

      // Nếu đang xem đúng người vừa gửi lời mời thì trigger UI update
      if (selectedUser && selectedUser._id === fromUserId) {
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    return () => {
      socket1.off("friend_request_received");
    };
  }, [selectedUser]);

  useEffect(() => {
    socket1.on("friend_request_revoked", ({ fromUserId }) => {
      console.log("🚫 Lời mời đã bị thu hồi từ:", fromUserId);
      setFriendRequests((prev) => {
        const updated = { ...prev };
        delete updated[fromUserId];
        return updated;
      });

      if (selectedUser && selectedUser._id === fromUserId) {
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    return () => {
      socket1.off("friend_request_revoked");
    };
  }, [selectedUser]);

  useEffect(() => {
    socket1.on("friend_request_accepted", ({ fromUserId }) => {
      console.log("✅ Lời mời đã được chấp nhận bởi:", fromUserId);
      setFriendRequests((prev) => ({
        ...prev,
        [fromUserId]: {
          ...prev[fromUserId],
          status: "accepted",
        },
      }));
      setRefreshTrigger((prev) => prev + 1);
    });

    socket1.on("friend_request_rejected", ({ fromUserId }) => {
      console.log("❌ Lời mời bị từ chối bởi:", fromUserId);
      setFriendRequests((prev) => {
        const updated = { ...prev };
        delete updated[fromUserId];
        return updated;
      });
      setRefreshTrigger((prev) => prev + 1);
    });

    return () => {
      socket1.off("friend_request_accepted");
      socket1.off("friend_request_rejected");
    };
  }, [selectedUser]);

  useEffect(() => {
    socket1.on("friend_request_accepted", ({ fromUserId }) => {
      console.log("📩 Lời mời kết bạn đã được chấp nhận bởi:", fromUserId);

      setFriendRequests((prev) => ({
        ...prev,
        [fromUserId]: {
          ...prev[fromUserId],
          status: "accepted",
        },
      }));

      // Nếu đang xem đúng user đó => update UI
      if (selectedUser && selectedUser._id === fromUserId) {
        setFriendStatus("accepted");
        setRefreshTrigger((prev) => prev + 1);
      }
    });

    return () => {
      socket1.off("friend_request_accepted");
    };
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      handleSelectUser(selectedUser);
    }
  }, [refreshTrigger]);

  //Chon ng dung
  const handleSelectUser = async (user) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    // Cập nhật selected user trước
    setSelectedUser(user);

    try {
      await fetchFriendRequestsAndUpdate();

      // Kiểm tra trạng thái bạn bè thực sự
      const res = await Api_FriendRequest.checkFriendStatus({
        userIdA: currentUserId,
        userIdB: user._id,
      });

      console.log("Trạng thái bạn bè thực sự:", res.status);
      setFriendStatus(res?.status || "not_friends");
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái bạn bè:", error);
      setFriendStatus("not_friends");
    }
  };

  //Modal groups
  const toggleGroupsModal = () => {
    setIsModalGroupsOpen(!isModalGroupsOpen);
  };

  //Lay ds ng dung
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await Api_Profile.getProfiles();
        if (Array.isArray(response.data.users)) {
          setAllUsers(response.data.users);
        } else {
          console.error("Dữ liệu nhận không phải mảng:", response.data.users);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Cập nhật trạng thái bạn bèeeee:", friendRequests);
    const fetchFriendRequests = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

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
            console.warn("Dữ liệu recipient bị thiếu:", req);
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
            console.warn("Dữ liệu requester bị thiếu:", req);
          }
        });

        setFriendRequests(newRequestStatus);
        console.log("Dữ liệu trạng thái kết bạn:", newRequestStatus);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách lời mời:", error);
      }
    };

    fetchFriendRequests();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedUser) {
      handleSelectUser(selectedUser);
    }
  }, [refreshTrigger]);

  const handleSearch = () => {
    const cleanedInput = searchValue.replace(/\D/g, "");
    const filtered = allUsers.filter((user) =>
      user.phone.includes(cleanedInput)
    );
    setFilteredResults(filtered);
    console.log(filtered);
  };

  const handleFriendRequest = () => {
    const currentUserId = localStorage.getItem("userId");

    if (!currentUserId || !selectedUser || !selectedUser._id) return;

    const existingRequest = friendRequests[selectedUser._id];

    // Nếu đã gửi lời mời và đang chờ => thu hồi
    if (existingRequest?.status === "pending" && existingRequest.isRequester) {
      socket1.emit(
        "send_friend_request",
        {
          fromUserId: currentUserId,
          toUserId: selectedUser._id,
        },
        (response) => {
          if (response.status === "revoked") {
            console.log("🗑️ Thu hồi lời mời thành công");
            setFriendRequests((prev) => {
              const updated = { ...prev };
              delete updated[selectedUser._id];
              return updated;
            });
            setRefreshTrigger((prev) => prev + 1);
          }
        }
      );
    } else {
      // Chưa gửi thì gửi mới
      socket1.emit(
        "send_friend_request",
        {
          fromUserId: currentUserId,
          toUserId: selectedUser._id,
        },
        (response) => {
          if (response.status === "ok") {
            console.log("✅ Gửi lời mời thành công");
            setFriendRequests((prev) => ({
              ...prev,
              [selectedUser._id]: {
                status: "pending",
                isRequester: true,
                requestId: response.requestId,
              },
            }));
            setRefreshTrigger((prev) => prev + 1);
          } else if (response.status === "exists") {
            console.log("⚠️ Lời mời đã tồn tại");
          }
        }
      );
    }
  };

  const handleRespondRequest = (requestId, action) => {
    const userId = localStorage.getItem("userId");

    socket1.emit(
      "respond_friend_request",
      { requestId, action, userId },
      (response) => {
        if (response.status === "accepted") {
          console.log("🎉 Đã chấp nhận lời mời");
          setFriendRequests((prev) => ({
            ...prev,
            [selectedUser._id]: {
              ...prev[selectedUser._id],
              status: "accepted",
            },
          }));
          setFriendStatus("accepted"); // Cập nhật UI ngay
        } else if (response.status === "rejected") {
          console.log("⛔ Đã từ chối lời mời");
          setFriendRequests((prev) => {
            const updated = { ...prev };
            delete updated[selectedUser._id];
            return updated;
          });
          setFriendStatus("not_friends");
        } else {
          console.error("Lỗi phản hồi:", response.message);
        }

        setRefreshTrigger((prev) => prev + 1);
      }
    );
  };

  const fetchFriendRequestsAndUpdate = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

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
        }
      });

      receivedRes.data.forEach((req) => {
        if (req.requester && req.requester._id) {
          newRequestStatus[req.requester._id] = {
            status: req.status,
            requestId: req._id,
            isRequester: false,
          };
        }
      });

      setFriendRequests(newRequestStatus);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lời mời:", error);
    }
  };

const handleStartChat = async (conv) => {
  try {
    const userId = localStorage.getItem("userId");
    const participant = conv.participants.find(p => p.userId._id === userId);

    // Nếu cuộc trò chuyện bị ẩn và có PIN
    if (participant?.isHidden && participant?.pin) {
      setSelectedHiddenConversation(conv);
      setIsPinModalOpen(true);
      return;
    }

    // Gọi hàm proceedWithChat để xử lý tiếp
    proceedWithChat(conv);
  } catch (error) {
    console.error("Lỗi khi bắt đầu trò chuyện:", error);
    toast.error("Đã xảy ra lỗi khi mở trò chuyện.");
  }
};

const proceedWithChat = (conv) => {
  const conversationId = conv._id;
  const isGroup = conv.isGroup;
  const userId = localStorage.getItem("userId");

  // Lấy displayName, ưu tiên conv.displayName, nếu không có thì lấy tên nhóm hoặc tên người dùng
  const name = conv.displayName || (isGroup ? conv.name || "Nhóm không tên" : conv.participants.find(p => p.userId._id !== userId)?.userId?.name || "Người dùng không xác định");

  const avatar = isGroup
    ? conv.imageGroup || "https://picsum.photos/200/300"
    : conv.participants.find((p) => p.userId._id !== userId)?.userId?.avatar ||
      "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  dispatch(
    setSelectedMessage({
      id: conversationId,
      isGroup,
      participants: conv.participants,
      name, // Sử dụng name đã tính toán
      imageGroup: avatar,
      isHidden: conv.participants.find(p => p.userId._id === userId)?.isHidden || false,
    })
  );

  setPhone("");
  setShowSearchModal(false);
  navigate("/chat");
};

  const handlePinVerified = () => {
    if (selectedHiddenConversation) {
      proceedWithChat(selectedHiddenConversation);
    }
    setIsPinModalOpen(false);
    setSelectedHiddenConversation(null);
  };
  return (
    <div className="flex items-center bg-gray-200 px-3 py-2 rounded-full w-full relative">
      <FaSearch
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
        size={16}
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Tìm kiếm tên hoặc số điện thoại"
        className="bg-transparent text-gray-700 placeholder-gray-500 pl-10 pr-2 py-1 flex-grow focus:outline-none"
        value={phone}
        onFocus={() => {
          setIsSearchFocused(true);
          if (!phone.trim()) {
            setShowSearchModal(true); // hiện modal "không có kết quả"
          }
        }}
        onChange={(e) => {
          const value = e.target.value;
          setPhone(value);
          debouncedSearch(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleTopSearch(phone); // tìm user
          }
        }}
      />

      <FaUserFriends
        className="text-gray-500 mx-2 cursor-pointer"
        size={20}
        onClick={toggleFriendsModal}
      />
      <FaUsers
        className="text-gray-500 mx-2 cursor-pointer"
        size={20}
        onClick={toggleCreateGroupModal} // Trigger CreateGroup modal
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
                  type="tel"
                  placeholder="Số điện thoại"
                  className="flex-grow px-4 py-2 text-gray-700 focus:outline-none"
                  value={searchValue}
                  onChange={(e) =>
                    setSearchValue(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-gray-700"
                onClick={toggleFriendsModal}
              >
                Hủy
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleSearch}
              >
                Tìm kiếm
              </button>
            </div>

            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
              {searchValue && filteredResults.length > 0 ? (
                filteredResults.map((user) => {
                  const currentUserId = localStorage.getItem("userId");
                  const isMe = user._id === currentUserId;

                  return (
                    <div
                      key={user._id}
                      className={`flex items-center p-2 ${!isMe ? "hover:bg-gray-100 cursor-pointer" : ""
                        } rounded`}
                      onClick={() => {
                        if (!isMe) handleSelectUser(user);
                      }}
                    >
                      <img
                        src={
                          user.avatar ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt={user.firstname}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {`${user.firstname} ${user.surname}`}{" "}
                          {isMe && (
                            <span className="text-xs text-blue-500">(me)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">Không có kết quả tìm kiếm.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal thông tin người dùng */}
      {selectedUser && (
        <div
          key={refreshTrigger}
          className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-2 right-3 text-gray-600 text-xl"
            >
              ×
            </button>

            <div className="flex items-center mb-4">
              <img
                src={
                  selectedUser.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt={selectedUser.firstname}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {`${selectedUser.firstname} ${selectedUser.surname}`}
                </h2>
              </div>
            </div>
            {selectedUser && (
              <div className="flex justify-end space-x-2 mt-4">
                {friendStatus === "accepted" ? (
                  <button className="bg-green-500 text-white px-4 py-2 rounded">
                    Đã là bạn bè
                  </button>
                ) : friendRequests[selectedUser._id]?.status === "pending" ? (
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
                ) : (
                  <button
                    onClick={handleFriendRequest}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Kết bạn
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal kết quả tìm kiếm */}
      {showSearchModal && (
        <div
          ref={modalRef}
          className="absolute top-full mt-2 left-0 w-full bg-white rounded shadow z-10 max-h-64 overflow-y-auto"
        >
          {searchResults.length > 0 ? (
            searchResults.map((conv) => {
              const userId = localStorage.getItem("userId");
              const isGroup = conv.isGroup;
              const displayName = conv.displayName || "Unknown User";
              const avatarUrl = isGroup
                ? conv.imageGroup || "https://picsum.photos/200/300"
                : conv.participants.find((p) => p.userId._id !== userId)?.userId
                  ?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              const isHidden = conv.participants.find(p => p.userId._id === userId)?.isHidden;

              return (
                <button
                  key={conv._id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition duration-150 text-left"
                  onClick={() => handleStartChat(conv)}
                >
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {displayName}
                      {isGroup && (
                        <span className="text-xs text-blue-500 ml-2">(Nhóm)</span>
                      )}
                      {/* {isHidden && (
                        <span className="text-xs text-red-500 ml-2">(Đã ẩn)</span>
                      )} */}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-gray-500 text-center p-4">
              {phone.trim()
                ? "Không tìm thấy cuộc trò chuyện phù hợp."
                : "Vui lòng nhập tên hoặc số điện thoại để tìm kiếm."}
            </p>
          )}
        </div>
      )}

      {/* Modal xác thực PIN */}
      {isPinModalOpen && selectedHiddenConversation && (
        <PinVerificationModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          conversationId={selectedHiddenConversation._id}
          userId={localStorage.getItem("userId")}
          socket={socket}
          onVerified={handlePinVerified}
        />
      )}

      {/* Modal tạo nhóm */}
      <CreateGroup
        isOpen={isModalCreateGroupOpen}
        onClose={toggleCreateGroupModal}
        onGroupCreated={handleGroupCreated}
        userId={localStorage.getItem("userId")}
        socket={socket}
      />
    </div>
  );
}

export default Search;