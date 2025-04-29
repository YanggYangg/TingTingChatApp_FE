import React, { useState, useEffect } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { initSocket } from "../../../../socket";

const GroupMemberList = ({ chatInfo, userId, onMemberRemoved }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);
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
    const fetchCommonGroups = async () => {
      if (chatInfo?.isGroup || !chatInfo?._id) return;

      try {
        const res = await Api_chatInfo.getCommonGroups(chatInfo._id);
        setCommonGroups(res?.commonGroups || []);
      } catch (err) {
        console.error("Lỗi khi lấy nhóm chung:", err);
        setCommonGroups([]);
      }
    };

    fetchCommonGroups();
  }, [chatInfo]);

  useEffect(() => {
    if (!socket || !chatInfo?._id) return;

    socket.on("groupUpdated", (data) => {
      if (data.conversationId === chatInfo._id && !chatInfo.isGroup) {
        setCommonGroups(data.commonGroups || []);
      }
    });

    return () => {
      socket.off("groupUpdated");
    };
  }, [socket, chatInfo]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thông tin hội thoại</h3>
      {chatInfo?.isGroup ? (
        <p className="text-blue-500 cursor-pointer" onClick={() => setMemberModalOpen(true)}>
          {chatInfo.participants?.length || 0} thành viên
        </p>
      ) : (
        <p className="text-blue-500 cursor-pointer" onClick={() => setGroupModalOpen(true)}>
          {commonGroups.length} nhóm chung
        </p>
      )}
      <MemberListModal
        isOpen={isMemberModalOpen}
        onClose={() => setMemberModalOpen(false)}
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