import { useState } from "react";
import { AiOutlineCopy, AiOutlineArrowRight } from "react-icons/ai"; // Import icon từ react-icons
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal"; // Import modal

const ChatInfo = ({ groupName = "Nhóm không tên", groupAvatar, groupLink }) => {
  const [inviteLink] = useState(groupLink || "https://zalo.me/g/dvfhuk799");
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Đã sao chép link nhóm!");
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-md h-full overflow-y-auto">
      {/* Tiêu đề trên cùng */}
      <h2 className="text-xl font-bold text-center text-gray-900 mb-4">
        Thông tin nhóm
      </h2>

      {/* Thông tin nhóm */}
      <div className="text-center mb-4">
        <img
          src={groupAvatar || "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg"}
          alt="Group Avatar"
          className="w-20 h-20 rounded-full mx-auto object-cover"
        />
        <h2 className="text-lg font-semibold mt-2">{groupName}</h2>
      </div>

      {/* Các nút hành động */}
      <div className="grid grid-cols-4 gap-2 my-4">
        <GroupActionButton icon="mute" text="Tắt thông báo" onClick={() => setIsMuteModalOpen(true)} />
        <GroupActionButton icon="pin" text="Bỏ ghim hội thoại" />
        <GroupActionButton icon="add" text="Thêm thành viên" />
        <GroupActionButton icon="settings" text="Quản lý nhóm" />
      </div>

      {/* Thành viên nhóm */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <GroupMemberList members={["4 thành viên"]} />

        {/* Link tham gia nhóm */}
        <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
          <div>
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm"
            >
              {inviteLink}
            </a>
          </div>
          <div className="flex space-x-2">
            <button onClick={copyToClipboard} className="text-gray-500 hover:text-blue-500">
              <AiOutlineCopy size={20} />
            </button>
            <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500">
              <AiOutlineArrowRight size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Ảnh/Video */}
      <GroupMediaGallery />

      {/* File */}
      <GroupFile />

      {/* Link */}
      <GroupLinks />

      {/* Thiết lập bảo mật */}
      <SecuritySettings />

      {/* Modal tắt thông báo */}
      <MuteNotificationModal isOpen={isMuteModalOpen} onClose={() => setIsMuteModalOpen(false)} />
    </div>
  );
};

export default ChatInfo;
