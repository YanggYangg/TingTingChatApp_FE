import React, { useState } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";

const GroupMemberList = ({ chatInfo, userId, onMemberRemoved, socket, commonGroups }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thông tin hội thoại</h3>
      {chatInfo?.isGroup ? (
        <p className="text-blue-500 cursor-pointer" onClick={() => setMemberModalOpen(true)}>
          {chatInfo.participants?.length || 0} thành viên
        </p>
      ) : (
        <p className="text-blue-500 cursor-pointer" onClick={() => setGroupModalOpen(true)}>
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
        commonGroups={commonGroups || []} // Truyền commonGroups từ props
      />
    </div>
  );
};

export default GroupMemberList;