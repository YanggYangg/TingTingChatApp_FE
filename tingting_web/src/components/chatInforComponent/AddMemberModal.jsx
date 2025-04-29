import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";
import { initSocket } from "../../services/sockets/index";

Modal.setAppElement("#root");

const AddMemberModal = ({ isOpen, onClose, conversationId, onMemberAdded, userId, currentMembers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [errorFriends, setErrorFriends] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const newSocket = initSocket(userId);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!isOpen || !userId || !conversationId) {
        setErrorFriends("Thiếu thông tin để tải danh sách bạn bè.");
        return;
      }

      setLoadingFriends(true);
      setErrorFriends("");
      const abortController = new AbortController();

      try {
        const response = await Api_FriendRequest.getFriendsList(userId, {
          signal: abortController.signal,
        });
        const friends = Array.isArray(response.data)
          ? response.data
          : response.data?.friends || [];
        const filteredFriends = friends.filter(
          (friend) =>
            !currentMembers?.some(
              (memberId) =>
                memberId === (friend._id || friend.id || friend.userID)
            )
        );
        setFriendsList(filteredFriends);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorFriends("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
        }
      } finally {
        setLoadingFriends(false);
      }

      return () => abortController.abort();
    };

    fetchFriends();
  }, [isOpen, userId, conversationId, currentMembers]);

  const filteredFriends = useMemo(
    () =>
      friendsList
        .filter((friend) =>
          friend.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [friendsList, searchTerm]
  );

  const addMember = async (memberId) => {
    if (!conversationId || !memberId) {
      setError("Thiếu thông tin để thêm thành viên.");
      return;
    }

    try {
      const participantData = { userId: memberId, role: "member" };
      const response = await Api_chatInfo.addParticipant(conversationId, participantData);
      if (response?.participants?.some((p) => p.userId === memberId)) {
        setFriendsList((prev) =>
          prev.filter((friend) => (friend._id || friend.id) !== memberId)
        );
        setSuccessMessage("Thêm thành viên thành công!");
        socket.emit("addMember", { conversationId, userId: memberId });
        if (onMemberAdded) {
          onMemberAdded(memberId);
        }
      }
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error);
      setError("Không thể thêm thành viên. Vui lòng thử lại.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
      {successMessage && (
        <p className="text-green-500 text-sm text-center">{successMessage}</p>
      )}
      {errorFriends && (
        <p className="text-red-500 text-sm text-center">{errorFriends}</p>
      )}
      <div className="flex-1 overflow-y-auto">
        {loadingFriends ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : filteredFriends.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            Không tìm thấy bạn bè để thêm
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredFriends.map((friend) => (
              <li
                key={friend._id || friend.id}
                className="flex items-center gap-2 p-2 border rounded-md"
              >
                <img
                  src={friend.avatar || "https://via.placeholder.com/30"}
                  alt={friend.name}
                  className="w-8 h-8 rounded-full"
                />
                <p className="flex-1 text-sm">{friend.name}</p>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
                  onClick={() => addMember(friend._id || friend.id)}
                >
                  Thêm
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t pt-3">
        <button
          className="bg-gray-300 px-3 py-1 rounded-md text-sm"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </Modal>
  );
};

export default AddMemberModal;