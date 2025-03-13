import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";

const ChatInfo = ({ links }) => {
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-md h-full overflow-y-auto">
      {/* Thông tin nhóm */}
      <div className="text-center mb-4">
        <img
          src="https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/474062gsa/hinh-anh-tho-cute-chibi-tuyet-dep_105035983.jpg"
          alt="Group Avatar"
          className="w-20 h-20 rounded-full mx-auto"
        />
        <h2 className="text-lg font-semibold mt-2">BỤP BỤP BỤP 🦆</h2>
      </div>

      {/* Các nút hành động */}
      <div className="grid grid-cols-4 gap-2 my-4">
        <GroupActionButton icon="🔕" text="Tắt thông báo" />
        <GroupActionButton icon="📌" text="Bỏ ghim hội thoại" />
        <GroupActionButton icon="➕" text="Thêm thành viên" />
        <GroupActionButton icon="⚙️" text="Quản lý nhóm" />
      </div>

      {/* Thành viên nhóm */}
      <GroupMemberList members={["3 thành viên"]} />

      {/* Ảnh/Video */}
      <GroupMediaGallery />

      {/* Ảnh/Video */}
      <GroupFile />

      {/* Link */}
      <GroupLinks links={links} />

      {/* Thiết lập bảo mật */}
      <SecuritySettings />
    </div>
  );
};

export default ChatInfo;