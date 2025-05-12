import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserFriends, FaUsers, FaCamera } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import CreateGroup from "./CreateGroup";
import { useSocket } from "../../contexts/SocketContext"; // Import socket from context or wherever it's defined

//socket
import socket from "../../utils/socket";

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

  

  const { socket } = useSocket(); // Get socket from context
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
  // useEffect(() => {
  //   const userId = localStorage.getItem("userId");
  //   if (userId) socket.emit("add_user", userId);
  //   console.log("🔔 Đã kết nối với socket server:", userId);
  // }, []);

  // useEffect(() => {
  //   const handleReceived = ({ fromUserId }) => {
  //     console.log("📩 Nhận lời mời kết bạn từ:", fromUserId);
  //     setRefreshTrigger(prev => prev + 1);
  //   };
  
  //   const handleResponded = ({ toUserId, action }) => {
  //     console.log(`✅ Người kia đã ${action} lời mời kết bạn`);
  //     setRefreshTrigger(prev => prev + 1);
  //   };
  
  //   socket.on("friend_request_received", handleReceived);
  //   socket.on("friend_request_responded", handleResponded);
  
  //   return () => {
  //     socket.off("friend_request_received", handleReceived);
  //     socket.off("friend_request_responded", handleResponded);
  //   };
  // }, []);
  

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

  //polling
  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (!selectedUser || !friendRequests[selectedUser._id]) return;

    const isRequester = friendRequests[selectedUser._id]?.isRequester;

    if (!isRequester) return;

    const intervalId = setInterval(async () => {
      try {
        const sentRes = await Api_FriendRequest.getSentRequests(currentUserId);
        const matchedRequest = sentRes.data.find(
          (req) => req.recipient?._id === selectedUser._id
        );

        if (!matchedRequest) {
          // đã bị từ chối
          setFriendRequests((prev) => {
            const updated = { ...prev };
            delete updated[selectedUser._id];
            return updated;
          });
          setRefreshTrigger((prev) => prev + 1);
        } else if (matchedRequest.status === "accepted") {
          // đã được chấp nhận
          setFriendRequests((prev) => ({
            ...prev,
            [selectedUser._id]: {
              status: "accepted",
              requestId: matchedRequest._id,
              isRequester: true,
            },
          }));
          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Polling lỗi:", err);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [selectedUser, friendRequests]);

  const handleSearch = () => {
    const cleanedInput = searchValue.replace(/\D/g, "");
    const filtered = allUsers.filter((user) =>
      user.phone.includes(cleanedInput)
    );
    setFilteredResults(filtered);
    console.log(filtered);
  };

  const handleFriendRequest = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !selectedUser || !selectedUser._id) return;


    const existingRequest = friendRequests[selectedUser._id];


    try {
      const userPhoneRes = await Api_Profile.getUserPhone(userId);
      const currentUserPhone = userPhoneRes.phone;

      if (
        existingRequest &&
        existingRequest.status === "pending" &&
        existingRequest.isRequester
      ) {
        // Nếu đã gửi lời mời => thu hồi
        await Api_FriendRequest.cancelFriendRequest({
          requesterId: userId,
          recipientId: selectedUser._id,
        });


        // Xóa trạng thái lời mời khỏi state
        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });
      } else {
        // Gửi lời mời mới
        await Api_FriendRequest.sendFriendRequest({
          requesterPhone: currentUserPhone,
          recipientPhone: selectedUser.phone,
        });

        //socket
        // socket.emit("send_friend_request", {
        //   fromUserId: userId,
        //   toUserId: selectedUser._id
        // });

        setFriendRequests((prev) => ({
          ...prev,
          [selectedUser._id]: {
            status: "pending",
            requestId: "temp", // Bạn có thể thay bằng ID thực sau
            isRequester: true,
          },
        }));
      }

      await fetchFriendRequestsAndUpdate();
      await handleSelectUser(selectedUser);
      // Refresh dữ liệu
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Lỗi xử lý lời mời kết bạn:", err);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await Api_FriendRequest.respondToFriendRequest({
        requestId,
        action,
        userId,
      });
   

      // socket.emit("respond_friend_request", {
      //   fromUserId: selectedUser._id, // người gửi lời mời
      //   toUserId: userId,             // người phản hồi
      //   action, // "accepted" hoặc "rejected"
      // });

      
      if (action === "accepted") {
        setFriendRequests((prev) => ({
          ...prev,
          [selectedUser._id]: {
            status: "accepted",
            requestId,
            isRequester: false, // bên nhận
          },
        }));
        // Ép re-render lại component đang hiển thị selectedUser
        setSelectedUser((prevUser) => ({ ...prevUser }));


      } else if (action === "rejected") {
        // Xóa trạng thái lời mời đã bị từ chối
        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });
        setSelectedUser((prevUser) => ({ ...prevUser }));
      }

      await fetchFriendRequestsAndUpdate();
      await handleSelectUser(selectedUser);
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 100); // 100ms sau tăng thêm lần nữa
    } catch (err) {
      console.error("Lỗi khi phản hồi lời mời kết bạn:", err);
    }
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

  return (
    <div className="flex items-center bg-gray-200 px-3 py-2 rounded-full w-full relative">
      <FaSearch
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
        size={16}
      />
      {/*Tìm kiếm conversation */}
      <input
        type="text"
        placeholder="Tìm kiếm"
        className="bg-transparent text-gray-700 placeholder-gray-500 pl-10 pr-2 py-1 flex-grow focus:outline-none"
        onChange={(e) => setPhone(e.target.value)}
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
                &times;
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
            {/* 
            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
              {searchValue && filteredResults.length > 0 ? (
                filteredResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => handleSelectUser(user)}
                  >
                    <img
                      src={user.avatar}
                      alt={user.firstname}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{`${user.firstname} ${user.surname}`}</p>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có kết quả tìm kiếm.</p>
              )}
            </div> */}
            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
              {searchValue && filteredResults.length > 0 ? (
                filteredResults.map((user) => {
                  const currentUserId = localStorage.getItem("userId");
                  const isMe = user._id === currentUserId;

                  return (
                    <div
                      key={user._id}
                      className={`flex items-center p-2 ${
                        !isMe ? "hover:bg-gray-100 cursor-pointer" : ""
                      } rounded`}
                      onClick={() => {
                        if (!isMe) handleSelectUser(user);
                      }}
                    >
                      <img
                        src={user.avatar}
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
              &times;
            </button>

            <div className="flex items-center mb-4">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.firstname}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {`${selectedUser.firstname} ${selectedUser.surname}`}
                </h2>
              </div>
            </div>

            {/* {selectedUser && (
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
)} */}
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
