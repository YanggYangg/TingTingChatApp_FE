import { useState } from "react";
import { AiOutlineCopy, AiOutlineArrowRight } from "react-icons/ai"; // Import icon từ react-icons
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal"; // Import modal

const ChatInfo = ({ groupName = "Nhóm không tên", groupAvatar, groupLink, type, memberCount, commonGroupCount }) => {
  const [inviteLink] = useState(groupLink || "https://zalo.me/g/dvfhuk799");
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteNotification = () => {
    if (isMuted) {
      console.log("🔊 Bật lại thông báo");
      setIsMuted(false);
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const confirmMuteNotification = (time) => {
    console.log(`🔕 Đã tắt thông báo trong: ${time}`);
    setIsMuted(true);
    setIsMuteModalOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    console.log("Link nhóm đã được sao chép:", inviteLink);
    alert("Đã sao chép link nhóm!");
  };

  const togglePinMessage = () => {
    if (pinnedMessage) {
      setPinnedMessage(null);
      console.log("Đã bỏ ghim tin nhắn");
    } else {
      const message = prompt("Nhập nội dung tin nhắn cần ghim:");
      if (message) {
        setPinnedMessage(message);
        console.log("Tin nhắn đã ghim:", message);
      }
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      {/* Tiêu đề trên cùng */}

      <div className="pb-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-center text-gray-900 mb-4">
        {type === "group" ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto mt-4">

      {/* Thông tin nhóm */}
      <div className="text-center mb-4">
        <img
          src={
            groupAvatar ||
            "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg"
          }
          alt="Group Avatar"
          className="w-20 h-20 rounded-full mx-auto object-cover"
        />
        <h2 className="text-lg font-semibold mt-2">{groupName}</h2>
      </div>

      {/* Các nút hành động */}
      <div className="grid grid-cols-4 gap-2 my-4">
        <GroupActionButton
          icon="mute"
          text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
          onClick={handleMuteNotification}
        />

        <GroupActionButton
          icon="pin"
          text={pinnedMessage ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
          onClick={togglePinMessage}
        />
        <GroupActionButton
          icon="add"
          text="Thêm thành viên"
          onClick={() => console.log("Nhấn vào 'Thêm thành viên'")}
        />
     {type === "group" && (
          <GroupActionButton
            icon="settings"
            text="Quản lý nhóm"
            onClick={() => console.log(" Nhấn vào 'Quản lý nhóm'")}
          />
        )}
      </div>
      {pinnedMessage && (
        <div className="bg-yellow-100 p-3 rounded-md flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">{pinnedMessage}</p>
          <button onClick={togglePinMessage} className="text-red-500 text-sm">
            Bỏ ghim
          </button>
        </div>
      )}
      {/* Thành viên nhóm hoặc số nhóm chung */}
      <div className="bg-gray-100 p-3 rounded-lg">
        <GroupMemberList members={type === "group" ? `${memberCount} thành viên` : `${commonGroupCount} nhóm chung`} />


        {/* Link tham gia nhóm */}
        {type === "group" && (
        <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
          <div>
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm"
              onClick={() =>
                console.log("🔗 Nhấn vào link tham gia nhóm:", inviteLink)
              }
            >
              {inviteLink}
            </a>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-blue-500"
            >
              <AiOutlineCopy size={20} />
            </button>
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-500"
              onClick={() =>
                console.log("➡️ Nhấn vào icon chuyển hướng đến link nhóm")
              }
            >
              <AiOutlineArrowRight size={20} />
            </a>
          </div>
        </div>
        )}

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
      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        onConfirm={confirmMuteNotification}
      />
    </div>
    </div>
  );
};

export default ChatInfo;
