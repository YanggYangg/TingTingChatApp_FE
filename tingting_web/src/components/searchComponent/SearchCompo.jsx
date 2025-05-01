import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserFriends, FaUsers, FaCamera } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import CreateGroup from "./CreateGroup";
import { useSocket } from "../../contexts/SocketContext"; // Import socket from context or wherever it's defined


function Search() {
  const [isModalFriendsOpen, setIsModalFriendsOpen] = useState(false);
  const [isModalCreateGroupOpen, setIsModalCreateGroupOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState({});
  const [friendStatus, setFriendStatus] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentUserPhone, setCurrentUserPhone] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const inputRef = useRef(null);

  const { socket } = useSocket(); // Get socket from context
  const toggleFriendsModal = () => {
    setIsModalFriendsOpen(!isModalFriendsOpen);
    setSearchValue("");
    setFilteredResults([]);
    setSelectedUser(null);
  };

  const handleSelectUser = (user) => {
    console.log("User selected:", user); // Kiểm tra xem người dùng đã được chọn chưa
    setSelectedUser(user);
  };


  // Toggle CreateGroup modal
  const toggleCreateGroupModal = () => {
    setIsModalCreateGroupOpen(!isModalCreateGroupOpen);
  };
  // Callback for when a group is created (optional)
  const handleGroupCreated = (groupData) => {
    console.log("Group created:", groupData);
    // Add logic to update UI if needed (e.g., add group to a list)
  };
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
    const fetchFriendRequests = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        const [sentRes, receivedRes] = await Promise.all([
          Api_FriendRequest.getSentRequests(userId),
          Api_FriendRequest.getReceivedRequests(userId),
        ]);

        const newRequestStatus = {};

        // Ng gui di
        // sentRes.data.forEach((req) => {
        //   newRequestStatus[req.recipient._id] = {
        //     status: req.status, // pending / accepted
        //     requestId: req._id,
        //     isRequester: true, //Minh la nguoi gui
        //   };
        // });
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

        //Ng nhan
        // receivedRes.data.forEach((req) => {
        //   newRequestStatus[req.requester._id] = {
        //     status: req.status,
        //     requestId: req._id,
        //     isRequester: false, //Minh la nguoi nhan
        //   };
        // });
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
        // console.log("Dữ liệu trạng thái kết bạn:", newRequestStatus);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách lời mời:", error);
      }
    };

    fetchFriendRequests();
  }, [refreshTrigger]);

  // useEffect(() => {
  //   const fetchReceivedRequests = async () => {
  //     try{
  //       //Lay userID tu localstorage
  //       const userId = localStorage.getItem("userId");
  //       if (!userId) {
  //         console.error("Không tìm thấy userId trong localStorage");
  //         return;
  //       }
  //       const response = await Api_FriendRequest.getReceivedRequests(userId);
  //       const requests = response.data;

  //       const newRequestStatus = {};
  //       requests.forEach((req) => {
  //         if (req.status === "pending") {
  //           newRequestStatus[req.requester._id] = "pending";
  //         } else if (req.status === "accepted") {
  //           newRequestStatus[req.requester._id] = "accepted";
  //         }
  //       }
  //       );
  //       setFriendRequests(prev => ({ ...prev, ...newRequestStatus }));
  //     } catch (error) {
  //       console.error("Lỗi khi lấy danh sách lời mời:", error);
  //     }
  //   };
  //   fetchReceivedRequests();
  // }, []);

  const handleSearch = () => {
    const cleanedInput = searchValue.replace(/\D/g, "");
    const filtered = allUsers.filter((user) =>
      user.phone.includes(cleanedInput)
    );
    setFilteredResults(filtered);
    console.log(filtered);
  };

  // const handleFriendRequest = async () => {
  //   console.log("Nút Kết bạn đã được nhấn");
  //   console.log("selectedUser at the time of request:", selectedUser);
  //   console.log(
  //     "selectedUser phone:",
  //     selectedUser ? selectedUser.phone : "No phone available"
  //   );

  //   if (!selectedUser || !selectedUser.phone) {
  //     console.error(
  //       "Thông tin người dùng không đầy đủ hoặc chưa chọn người dùng."
  //     );
  //     return;
  //   }

  //   try {
  //     const userId = localStorage.getItem("userId");
  //     if (!userId) {
  //       console.error("Không tìm thấy userId trong localStorage");
  //       return;
  //     }

  //     const response = await Api_Profile.getUserPhone(userId);
  //     console.log("API responseeeeee:", response);
  //     console.log("response.data:", response.data);
  //     const currentUserPhone = response.phone;

  //     console.log("Số điện thoại người dùng hiện tại:", currentUserPhone);


  //     await Api_FriendRequest.sendFriendRequest({
  //       requesterPhone: currentUserPhone,
  //       recipientPhone: selectedUser?.phone || "",
  //     });

  //     setFriendRequests((prev) => {
  //       const updatedRequests = {
  //         ...prev,
  //         [selectedUser._id]: {
  //           status: "pending",
  //           requestId: "temp-id-local", // bạn có thể để rỗng hoặc gán sau từ backend
  //           isRequester: true, // <- Quan trọng nhất
  //         },
  //       };
  //       console.log("Updated friend requests:", updatedRequests);
  //       return updatedRequests;
  //     });
  //     setRefreshTrigger((prev) => prev + 1);
  //     setTimeout(() => {
  //       setRefreshTrigger((prev) => prev + 1);
  //     }, 100); // 100ms sau tăng thêm lần nữa
  //   } catch (err) {
  //     console.error("Gửi lời mời kết bạn thất bại:", err);
  //   }
  // };

  const handleFriendRequest = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !selectedUser || !selectedUser._id) return;

    const existingRequest = friendRequests[selectedUser._id];

    try {
      const userPhoneRes = await Api_Profile.getUserPhone(userId);
      const currentUserPhone = userPhoneRes.phone;

      if (existingRequest && existingRequest.status === "pending" && existingRequest.isRequester) {
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

        setFriendRequests((prev) => ({
          ...prev,
          [selectedUser._id]: {
            status: "pending",
            requestId: "temp", // Bạn có thể thay bằng ID thực sau
            isRequester: true,
          },
        }));
      }

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
      // if (response.message.includes("accepted")) {
      //   // Update UI neu accept
      //   setFriendRequests((prev) => ({
      //     ...prev,
      //     [selectedUser._id]: {
      //       status: "accepted",
      //       requestId,
      //     },
      //   }));
      // }
      if (response.message.includes("rejected")) {
        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });

        // ⚠️ Cập nhật lại selectedUser để buộc re-render
        setSelectedUser((prevUser) => ({ ...prevUser }));
      } else if (response.message.includes("rejected")) {
        // Update UI neu reject
        setFriendRequests((prev) => {
          const updated = { ...prev };
          delete updated[selectedUser._id];
          return updated;
        });
      }
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 100); // 100ms sau tăng thêm lần nữa
    } catch (err) {
      console.error("Lỗi khi phản hồi lời mời kết bạn:", err);
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

            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
              {searchValue && filteredResults.length > 0 ? (
                filteredResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => setSelectedUser(user)}
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

            {/* Modal thông tin ng dùng */}
            {/* <div className="flex justify-end space-x-2 mt-4">
              {friendRequests[selectedUser._id]?.status === "pending" ? (
                friendRequests[selectedUser._id].isRequester ? (
                  <button
                    className="bg-yellow-400 text-white px-4 py-2 rounded"
                    disabled
                  >
                    Đang chờ
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
              ) : friendRequests[selectedUser._id]?.status === "accepted" ? (
                <>
                  <button className="bg-green-500 text-white px-4 py-2 rounded">
                    Đã là bạn bè
                  </button>
                </>
              ) : (

              //   // Không có yêu cầu nào → hiện "Kết bạn"
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => handleFriendRequest()}
                >
                  Kết bạn
                </button>
              )
            }
            </div> */}

            {selectedUser && (
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
