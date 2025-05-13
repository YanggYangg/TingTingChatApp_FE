import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";
import { removeParticipant, onError } from "../../services/sockets/events/chatInfo";
import { onConversationUpdate, offConversationUpdate } from "../../services/sockets/events/conversation";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../redux/slices/chatSlice";
import { joinConversation } from "../../services/sockets/events/conversation";

const MemberListModal = ({ socket, isOpen, onClose, chatInfo, currentUserId, onMemberRemoved }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (chatInfo?.participants && currentUserId) {
        const adminMember = chatInfo.participants.find(
          (member) => member.userId === currentUserId && member.role === "admin"
        );
        setIsAdmin(!!adminMember);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [chatInfo, currentUserId]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (chatInfo?.participants) {
        setLoadingDetails(true);
        setErrorDetails(null);
        const details = {};
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
                avatar: response.data.user.avatar,
                role: member.role,
              };
            } else {
              details[member.userId] = { name: "Không tìm thấy", avatar: null, role: member.role };
            }
          } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            details[member.userId] = { name: "Lỗi tải", avatar: null, role: member.role };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
    }
  }, [isOpen, chatInfo]);

  const handleRemoveMember = async (memberIdToRemove) => {
    if (!socket) {
      toast.error("Socket chưa kết nối, không thể xóa thành viên!");
      return;
    }

    if (isAdmin && currentUserId !== memberIdToRemove) {
      const confirmRemove = window.confirm(`Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?`);
      if (confirmRemove) {
        try {
          removeParticipant(socket, { conversationId: chatInfo._id, userId: memberIdToRemove }, (response) => {
            if (response.success) {
              console.log(`MemberListModal: Đã xóa thành viên ${memberIdToRemove} khỏi nhóm ${chatInfo._id}`);
              toast.success("Đã xóa thành viên khỏi nhóm!");
              if (onMemberRemoved) {
                onMemberRemoved(memberIdToRemove);
              }
            } else {
              console.error("MemberListModal: Lỗi khi xóa thành viên:", response.message);
              toast.error("Lỗi khi xóa thành viên: " + response.message);
            }
          });

          onError(socket, (error) => {
            console.error("MemberListModal: Lỗi từ server:", error);
            toast.error("Lỗi khi xóa thành viên: " + error.message);
          });
        } catch (error) {
          console.error("MemberListModal: Lỗi khi xóa thành viên:", error);
          toast.error("Lỗi khi xóa thành viên. Vui lòng thử lại.");
        }
      }
    } else if (currentUserId === memberIdToRemove) {
      toast.error("Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.");
    } else {
      toast.error("Bạn không có quyền xóa thành viên khỏi nhóm này.");
    }
  };

  // Hàm xử lý khi nhấn vào thành viên để mở hội thoại cá nhân
  const handleMemberClick = async (memberId) => {
    if (!socket) {
      toast.error("Socket chưa kết nối, không thể mở hội thoại!");
      return;
    }

    if (memberId === currentUserId) {
      toast.info("Bạn không thể trò chuyện với chính mình!");
      return;
    }

    try {
      // Gửi yêu cầu để lấy hoặc tạo hội thoại cá nhân
      socket.emit("getOrCreatePrivateConversation", { userId1: currentUserId, userId2: memberId }, async (response) => {
        if (response.success && response.conversation) {
          console.log(`MemberListModal: Nhận hội thoại cá nhân`, response.conversation);

          // Lấy thông tin người dùng từ API
          const profileResponse = await Api_Profile.getProfile(memberId);
          const userData = profileResponse?.data?.user || {};
          const name = `${userData.firstname || ""} ${userData.surname || ""}`.trim() || memberId;
          const avatar = userData.avatar || "https://via.placeholder.com/150";

          // Định dạng dữ liệu hội thoại
          const formattedMessage = {
            id: response.conversation._id,
            name,
            participants: response.conversation.participants || [{ userId: memberId }],
            isGroup: false,
            avatar,
            lastMessage: response.conversation.lastMessage?.content || "",
            lastMessageType: response.conversation.lastMessage?.messageType || "text",
            lastMessageSenderId: response.conversation.lastMessage?.userId || null,
            time: response.conversation.lastMessage?.createdAt
              ? new Date(response.conversation.lastMessage.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            updateAt: response.conversation.lastMessage?.createdAt || response.conversation.updatedAt,
            isPinned: response.conversation.participants.find((p) => p.userId === currentUserId)?.isPinned || false,
            mute: response.conversation.participants.find((p) => p.userId === currentUserId)?.mute || false,
            isHidden: response.conversation.participants.find((p) => p.userId === currentUserId)?.isHidden || false,
          };

          // Tham gia phòng hội thoại
          joinConversation(socket, formattedMessage.id);
          console.log(`MemberListModal: Tham gia phòng hội thoại cá nhân: ${formattedMessage.id}`);

          // Cập nhật Redux để chọn hội thoại
          dispatch(setSelectedMessage(formattedMessage));
          toast.success(`Đã mở hội thoại với ${name}`);

          // Đóng modal
          onClose();
        } else {
          console.error("MemberListModal: Lỗi khi lấy/tạo hội thoại cá nhân:", response.message);
          toast.error("Không thể mở hội thoại: " + response.message);
        }
      });

      // Lắng nghe lỗi từ server
      onError(socket, (error) => {
        console.error("MemberListModal: Lỗi từ server khi mở hội thoại:", error);
        toast.error("Lỗi khi mở hội thoại: " + error.message);
      });
    } catch (error) {
      console.error("MemberListModal: Lỗi khi xử lý hội thoại cá nhân:", error);
      toast.error("Lỗi khi mở hội thoại. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    return () => {
      offConversationUpdate(socket);
      socket.off("error");
    };
  }, [socket]);

  if (!chatInfo?.participants) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">
        Thành viên ({chatInfo.participants.length || 0})
      </h2>

      {loadingDetails ? (
        <p className="text-gray-500">Đang tải thông tin thành viên...</p>
      ) : errorDetails ? (
        <p className="text-red-500">{errorDetails}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {chatInfo.participants.map((member) => (
            <li
              key={member.userId}
              className="py-2 border-b last:border-none flex items-center justify-between hover:bg-gray-100 cursor-pointer"
              onClick={() => handleMemberClick(member.userId)}
            >
              <div className="flex items-center">
                <img
                  src={memberDetails[member.userId]?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s"}
                  alt={memberDetails[member.userId]?.name || "Người dùng"}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <span className="text-gray-800">{memberDetails[member.userId]?.name || "Không tên"}</span>
                {memberDetails[member.userId]?.role === "admin" && (
                  <span className="ml-1 text-xs text-blue-500">(Admin)</span>
                )}
              </div>
              {isAdmin && currentUserId !== member.userId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn sự kiện click trên li
                    handleRemoveMember(member.userId);
                  }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label={`Xóa ${memberDetails[member.userId]?.name}`}
                >
                  <FaTrash size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all"
      >
        Đóng
      </button>
    </Modal>
  );
};

export default MemberListModal;