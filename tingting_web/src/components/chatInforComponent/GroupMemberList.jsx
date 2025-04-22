// Path: src/components/chatInforComponent/GroupMemberList.js
import React, { useState, useEffect } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const GroupMemberList = ({ chatInfo, userId, onMemberRemoved }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);

  useEffect(() => {
    const fetchCommonGroups = async () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        try {
          const res = await Api_chatInfo.getCommonGroups(chatInfo._id);
          setCommonGroups(res?.commonGroups || []);
        } catch (err) {
          console.error("Lỗi khi lấy nhóm chung", err);
          setCommonGroups([]);
        }
      }
    };

    fetchCommonGroups();
  }, [chatInfo]);

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