import { useState } from "react";
import MemberListModal from "./MemberListModal "; // Thêm import

const GroupMemberList = ({ chatInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!chatInfo) return null; // Kiểm tra nếu chưa có dữ liệu

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thành viên nhóm</h3>
      <p
        className="text-blue-500 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {chatInfo.isGroup
          ? `${chatInfo.participants.length} thành viên`
          : `${chatInfo.commonGroups || 0} nhóm chung`}
      </p>

      <MemberListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chatInfo={chatInfo}
      />
    </div>
  );
};

export default GroupMemberList;
