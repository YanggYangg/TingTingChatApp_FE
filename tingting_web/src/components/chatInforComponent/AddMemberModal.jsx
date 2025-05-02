import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import {
  addParticipant,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo"; // Import các hàm Socket.IO

const AddMemberModal = ({ isOpen, onClose, conversationId, onMemberAdded, userId, currentMembers, socket }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [errorFriends, setErrorFriends] = useState("");

  // console.log("userId trong AddMemberModal:", userId);
  // console.log("conversationId trong AddMemberModal:", conversationId);
  // console.log("currentMembers trong AddMemberModal:", currentMembers);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!isOpen || !userId || !conversationId) {
        if (!userId) setErrorFriends("Thiếu thông tin người dùng.");
        if (!conversationId) setErrorFriends("Thiếu thông tin cuộc trò chuyện.");
        return;
      }

      setLoadingFriends(true);
      setErrorFriends("");
      try {
        const response = await Api_FriendRequest.getFriendsList(userId);
        let friends = Array.isArray(response.data)
          ? response.data
          : response.data?.friends || response.data?.data || [];

        if (!Array.isArray(friends)) {
          console.warn("Dữ liệu bạn bè không đúng định dạng:", response.data);
          setErrorFriends("Dữ liệu bạn bè không đúng định dạng. Vui lòng thử lại.");
          return;
        }

        console.log("Danh sách bạn bè thô:", friends);
        console.log("currentMembers để lọc:", currentMembers);

        const filteredFriends = friends.filter(
          (friend) =>
            !currentMembers?.some(
              (memberId) => memberId === (friend._id || friend.id || friend.userID)
            )
        );
        console.log("Danh sách bạn bè sau khi lọc:", filteredFriends);

        setFriendsList(filteredFriends);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè:", error);
        setErrorFriends(
          error.message.includes("timeout")
            ? "Yêu cầu hết thời gian. Vui lòng thử lại."
            : "Không thể tải danh sách bạn bè. Vui lòng thử lại."
        );
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [isOpen, userId, conversationId, currentMembers]);

  // Lắng nghe lỗi từ Socket.IO
  useEffect(() => {
    if (!socket || !isOpen) return;

    onError(socket, (error) => {
      setError(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    });

    return () => {
      offError(socket);
    };
  }, [socket, isOpen]);

  const filteredFriends = friendsList.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFriends = filteredFriends.sort((a, b) => a.name.localeCompare(b.name));

  const addMember = (memberId) => {
    if (!conversationId || !memberId || !socket) {
      setError("Thiếu thông tin để thêm thành viên hoặc không có kết nối Socket.IO.");
      return;
    }

    setError("");
    setSuccessMessage("");

    const participantData = { conversationId, userId: memberId, role: "member" };
    addParticipant(socket, participantData, (response) => {
      if (response && response.success) {
        setFriendsList((prev) => prev.filter((friend) => getMemberId(friend) !== memberId));
        setSuccessMessage("Thêm thành viên thành công!");
        if (onMemberAdded) {
          onMemberAdded();
        }
      } else {
        setError(response?.message || "Không thể thêm thành viên. Phản hồi từ server không hợp lệ.");
      }
    });
  };

  const getMemberId = (member) => member._id || member.id || member.userID;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Thêm thành viên"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      className="bg-white p-4 rounded-lg shadow-lg w-96 max-h-[70vh] flex flex-col"
    >
      <h2 className="text-lg font-semibold mb-3 text-center">Thêm thành viên</h2>

      <input
        type="text"
        placeholder="Nhập tên bạn bè..."
        className="w-full p-2 border rounded-md mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
      {errorFriends && <p className="text-red-500 text-sm text-center">{errorFriends}</p>}

      <div className="flex-1 overflow-y-auto">
        {loadingFriends ? (
          <p className="text-center text-gray-500">Đang tải danh sách bạn bè...</p>
        ) : (
          <ul className="space-y-2">
            {sortedFriends.length === 0 ? (
              <p className="text-center text-sm text-gray-500">Không tìm thấy bạn bè nào để thêm</p>
            ) : (
              sortedFriends.map((friend) => {
                const friendId = getMemberId(friend);
                return (
                  <li key={friendId} className="flex items-center gap-2 p-2 border rounded-md">
                    <img
                      src={friend.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User"}
                      alt={friend.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <p className="flex-1 text-sm">{friend.name}</p>
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
                      onClick={() => addMember(friendId)}
                    >
                      Thêm
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t pt-3">
        <button className="bg-gray-300 px-3 py-1 rounded-md text-sm" onClick={onClose}>
          Hủy
        </button>
      </div>
    </Modal>
  );
};

export default AddMemberModal;