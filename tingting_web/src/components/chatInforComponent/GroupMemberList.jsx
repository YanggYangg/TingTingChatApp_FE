const GroupMemberList = ({ chatInfo }) => {
  if (!chatInfo) return null; // Kiểm tra nếu chưa có dữ liệu

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thành viên nhóm</h3>
      {chatInfo.isGroup
        ? `${chatInfo.participants.length} thành viên`
        : `${chatInfo.commonGroups || 0} nhóm chung`}
    </div>
  );
};

export default GroupMemberList;
