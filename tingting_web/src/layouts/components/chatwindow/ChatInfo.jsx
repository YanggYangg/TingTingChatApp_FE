import { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";

const ChatInfo = () => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading
  const chatId = "67e2d6bef1ea6ac96f10bf91";
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await Api_chatInfo.getChatInfo(chatId);
        console.log("Thông tin chat nhận được từ API:", response);
        setChatInfo(response);
        setLoading(false);  // Đặt loading = false sau khi nhận data
      } catch (error) {
        console.error("Lỗi khi lấy thông tin chat:", error);
        setLoading(false);  // Đặt loading = false khi gặp lỗi
      }
    };
  
    if (chatId) {
      fetchChatInfo();
    }
  }, [chatId]);
  
  
  

  const handleMuteNotification = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatInfo?.linkGroup || "https://zalo.me/g/bamwwg826");
    alert("Đã sao chép link nhóm!");
  };

  if (loading) {
    return <p className="text-center text-gray-500">⏳ Đang tải thông tin chat...</p>;
  }

  if (!chatInfo) {
    return <p className="text-center text-red-500">❌ Không thể tải thông tin chat.</p>;
  }

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      {/* Phần tiêu đề cố định */}
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-center mb-4">
          {chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </h2>
      </div>

      {/* Nội dung có thể cuộn */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-center my-4">
          <img
            src={chatInfo?.avatar?.trim() ? chatInfo.avatar : "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/12/anh-dai-dien-zalo-thumbnail.jpg"}
            className="w-20 h-20 rounded-full mx-auto"
          />
          <h2 className="text-lg font-semibold">{chatInfo?.name || "Không có tên"}</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4 my-4">
          <GroupActionButton icon="mute" text={isMuted ? "Bật thông báo" : "Tắt thông báo"} onClick={handleMuteNotification} />
          <GroupActionButton icon="pin" text="Ghim tin nhắn" onClick={() => console.log("Ghim tin nhắn")} />
          <GroupActionButton icon="add" text="Thêm thành viên" onClick={() => console.log("Thêm thành viên")} />
        </div>

        <GroupMemberList chatInfo={chatInfo} />

        {chatInfo?.linkGroup && (
          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a href={chatInfo.linkGroup} className="text-blue-500 text-sm">{chatInfo.linkGroup}</a>
            <button onClick={copyToClipboard} className="text-gray-500 hover:text-blue-500">
              <AiOutlineCopy size={20} />
            </button>
          </div>
        )}

        <GroupMediaGallery chatId={chatId} />
        <GroupFile chatId={chatId} />
        <GroupLinks chatId={chatId} />
        <SecuritySettings chatId={chatId} />
      </div>

      <MuteNotificationModal isOpen={isMuteModalOpen} onClose={() => setIsMuteModalOpen(false)} onConfirm={() => setIsMuted(true)} />
    </div>
  );
};

export default ChatInfo;
