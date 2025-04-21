import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";

const AddMemberModal = ({ isOpen, onClose, conversationId, onMemberAdded, userId, currentMembers }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [friendsList, setFriendsList] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [errorFriends, setErrorFriends] = useState("");

    console.log("userId trong AddMemberModal:", userId);
    console.log("conversationId trong AddMemberModal:", conversationId);
    console.log("currentMembers trong AddMemberModal:", currentMembers);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!isOpen || !userId || !conversationId) return;
            setLoadingFriends(true);
            setErrorFriends("");
            try {
                const response = await Api_FriendRequest.getFriendsList(userId);
                let friends = response.data || [];

                if (currentMembers && currentMembers.length > 0) {
                    friends = friends.filter(friend =>
                        !currentMembers.some(memberId => memberId === (friend._id || friend.id || friend.userID))
                    );
                }
                setFriendsList(friends);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bạn bè:", error);
                setErrorFriends("Không thể tải danh sách bạn bè.");
            } finally {
                setLoadingFriends(false);
            }
        };

        fetchFriends();
    }, [isOpen, userId, conversationId, currentMembers]);

    const filteredFriends = friendsList.filter((friend) => {
        return friend.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const sortedFriends = filteredFriends.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });

    const addMember = async (memberId) => {
        if (!conversationId || !memberId) {
            setError("Thiếu thông tin để thêm thành viên.");
            return;
        }

        try {
            setError("");
            setSuccessMessage(""); // Reset thông báo thành công trước mỗi lần thử thêm

            const participantData = { userId: memberId, role: "member" };
            await Api_chatInfo.addParticipant(conversationId, participantData);

            // Chỉ hiển thị thông báo thành công và cập nhật UI khi API gọi thành công
            setFriendsList((prev) => prev.filter((friend) => getMemberId(friend) !== memberId));
            setSuccessMessage("Thêm thành viên thành công!");

            if (onMemberAdded) {
                onMemberAdded();
            }
        } catch (error) {
            console.error("Lỗi khi thêm thành viên:", error);
            setError("Không thể thêm thành viên. Vui lòng thử lại!");
        }
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
                                    <li
                                        key={friendId}
                                        className="flex items-center gap-2 p-2 border rounded-md"
                                    >
                                        <img
                                            src={friend.avatar}
                                            alt={friend.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <p className="flex-1 text-sm">
                                            {friend.name}
                                        </p>
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