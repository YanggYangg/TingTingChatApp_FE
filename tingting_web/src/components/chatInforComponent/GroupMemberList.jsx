import React, { useState } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";
import { toast } from "react-toastify";

const GroupMemberList = ({ chatInfo, userId, onMemberRemoved, socket, commonGroups, onGroupSelect }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  const handleOpenGroupModal = () => {
    if (!commonGroups?.length) {
      toast.info("Không có nhóm chung nào!");
      return;
    }
    setGroupModalOpen(true);
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thông tin hội thoại</h3>
      {chatInfo?.isGroup ? (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={() => setMemberModalOpen(true)}
        >
          {chatInfo.participants?.length || 0} thành viên
        </p>
      ) : (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={handleOpenGroupModal}
        >
          {commonGroups?.length || 0} nhóm chung
        </p>
      )}
      <MemberListModal
        isOpen={isMemberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        chatInfo={chatInfo}
        currentUserId={userId}
        onMemberRemoved={onMemberRemoved}
        socket={socket}
      />
      <CommonGroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        commonGroups={commonGroups || []}
        onGroupSelect={onGroupSelect}
      />
    </div>
  );
};

export default GroupMemberList;