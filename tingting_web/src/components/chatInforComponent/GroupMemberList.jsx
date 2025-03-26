import { useState } from "react";
import MemberListModal from "./MemberListModal";
import CommonGroupsModal from "./CommonGroupsModal";

const GroupMemberList = ({ chatInfo }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  // Debug: Kiểm tra dữ liệu đầu vào
  console.log("chatInfo trong GroupMemberList:", chatInfo);

  // Kiểm tra nếu chatInfo không tồn tại
  if (!chatInfo) return null;

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thông tin hội thoại</h3>

      {/* Hiển thị số thành viên hoặc nhóm chung */}
      {chatInfo.isGroup ? (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={() => setMemberModalOpen(true)}
        >
          {chatInfo?.participants?.length || 0} thành viên
        </p>
      ) : (
        <p
          className="text-blue-500 cursor-pointer"
          onClick={() => setGroupModalOpen(true)}
        >
          {chatInfo?.commonGroups?.length || 0} nhóm chung
        </p>
      )}

      {/* Modal danh sách thành viên */}
      {chatInfo?.participants && (
        <MemberListModal
          isOpen={isMemberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          chatInfo={chatInfo}
        />
      )}

      {/* Modal danh sách nhóm chung */}
      {chatInfo?.commonGroups && (
        <CommonGroupsModal
          isOpen={isGroupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          groups={chatInfo.commonGroups}
        />
      )}
    </div>
  );
};

export default GroupMemberList;
