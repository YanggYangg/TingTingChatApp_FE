import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_FriendRequest } from "../../../apis/Api_FriendRequest";

const AddMemberModal = ({ isOpen, onClose, conversationId, onMemberAdded, userId, participants }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const MAX_MEMBERS = 1000;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!isOpen || !userId) return;

      setLoadingFriends(true);
      setError("");
      try {
        const response = await Api_FriendRequest.getFriendsList(userId);
        const friendsData = response.data || [];
        const existingMemberIds = participants?.map((p) => p.userId) || [];
        const availableFriends = friendsData.filter((friend) => !existingMemberIds.includes(friend._id));

        setFriendsList(
          availableFriends.map((friend) => ({
            id: friend._id,
            firstName: friend.name,
            lastName: "",
            avatar: friend.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
          }))
        );
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn bè:", error);
        setError("Không thể tải danh sách bạn bè.");
        setFriendsList([]);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [isOpen, userId, participants]);

  const filteredFriends = friendsList.filter((friend) =>
    `${friend.lastName} ${friend.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFriends = filteredFriends.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  const addMember = async (memberId) => {
    if (!conversationId || !memberId) {
      setError("Thiếu thông tin để thêm thành viên.");
      return;
    }

    if (participants?.length >= MAX_MEMBERS) {
      setError("Nhóm đã đủ 1000 thành viên.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const participantData = { userID: memberId, role: "member" };
      const response = await Api_chatInfo.addParticipant(conversationId, participantData);
      const newParticipant = response.data?.participant || { userId: memberId, role: "member" };

      setFriendsList((prev) => prev.filter((friend) => friend.id !== memberId));
      setSuccessMessage("Thêm thành viên thành công!");

      if (onMemberAdded) {
        onMemberAdded(newParticipant);
      }
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error);
      setError("Không thể thêm thành viên. Vui lòng thử lại!");
    }
  };

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

      <div className="flex-1 overflow-y-auto">
        {loadingFriends ? (
          <p className="text-center text-gray-500">Đang tải danh sách bạn bè...</p>
        ) : sortedFriends.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Không tìm thấy bạn bè nào</p>
        ) : (
          <ul className="space-y-2">
            {sortedFriends.map((friend) => (
              <li key={friend.id} className="flex items-center gap-2 p-2 border rounded-md">
                <img src={friend.avatar} alt={friend.firstName} className="w-8 h-8 rounded-full" />
                <p className="flex-1 text-sm">{friend.firstName}</p>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
                  onClick={() => addMember(friend.id)}
                >
                  Thêm
                </button>
              </li>
            ))}
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