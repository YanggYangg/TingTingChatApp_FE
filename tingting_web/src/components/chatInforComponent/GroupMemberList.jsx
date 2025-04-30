// Path: src/components/chatInforComponent/GroupMemberList.js
import React, { useState, useEffect } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";
import { getCommonGroups, onCommonGroups, offCommonGroups, onError } from "../../services/sockets/events/chatInfo";

const GroupMemberList = ({ socket, chatInfo, userId, onMemberRemoved }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);

  useEffect(() => {
    if (!socket || !chatInfo?._id) return;

    const fetchCommonGroups = () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        // Gửi yêu cầu lấy nhóm chung qua socket
        getCommonGroups(socket, { conversationId: chatInfo._id }, (response) => {
          if (response.success) {
            setCommonGroups(response.data.commonGroups || []);
          } else {
            console.error("Lỗi khi lấy nhóm chung:", response.message);
            setCommonGroups([]);
          }
        });
      }
    };

    // Lắng nghe danh sách nhóm chung
    onCommonGroups(socket, (data) => {
      setCommonGroups(data.commonGroups || []);
    });

    // Lắng nghe lỗi từ server
    onError(socket, (error) => {
      console.error("Lỗi từ server:", error.message);
      setCommonGroups([]);
    });

    fetchCommonGroups();

    // Cleanup khi component unmount
    return () => {
      offCommonGroups(socket);
      socket.off("error");
    };
  }, [socket, chatInfo]);

  const handleOpenMemberModal = () => {
    setMemberModalOpen(true);
  };

  const handleCloseMemberModal = () => {
    setMemberModalOpen(false);
  };

  if (!chatInfo) return null;

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thông tin hội thoại</h3>

      {chatInfo.isGroup ? (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={handleOpenMemberModal}
        >
          {chatInfo.participants.length} thành viên
        </p>
      ) : (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={() => setGroupModalOpen(true)}
        >
          {commonGroups.length} nhóm chung
        </p>
      )}

      <MemberListModal
        socket={socket}
        isOpen={isMemberModalOpen}
        onClose={handleCloseMemberModal}
        chatInfo={chatInfo}
        currentUserId={userId}
        onMemberRemoved={onMemberRemoved}
      />

      <CommonGroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        commonGroups={commonGroups}
      />
    </div>
  );
};

export default GroupMemberList;