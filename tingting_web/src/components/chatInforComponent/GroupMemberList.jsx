// GroupMemberList.jsx
const GroupMemberList = ({ members }) => {
    return (
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Thành viên nhóm</h3>
        <p className="text-gray-600">{members}</p>
      </div>
    );
  };
  
  export default GroupMemberList;
  