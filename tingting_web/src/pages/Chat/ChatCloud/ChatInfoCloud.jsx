import React from "react";
import GroupMediaGalleryCloud from "../ChatCloud/GroupMediaGalleryCloud";
import GroupFileCloud from "../ChatCloud/GroupFileCloud";
import GroupLinksCloud from "../ChatCloud/GroupLinksCloud";

const ChatInfoCloud = ({ userId, conversationId, cloudMessages }) => {
  const cloudChat = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
    type: "cloud",
  };

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-center mb-4 select-none">
          Thông tin hội thoại
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center my-4">
          <img
            src={cloudChat.avatar}
            className="w-20 h-20 rounded-full mx-auto object-cover select-none"
            alt={cloudChat.name}
          />
          <div className="flex items-center justify-center mt-6">
            <h2 className="text-lg font-semibold select-none">
              {cloudChat.name}
            </h2>
          </div>
          <p className="mt-2 my-4 select-none text-sm opacity-75">
            Lưu trữ và truy cập nhanh những nội dung quan trọng của bạn ngay
            trên Zalo
          </p>
        </div>

        <GroupMediaGalleryCloud
          conversationId={conversationId}
          userId={userId}
          cloudMessages={cloudMessages}
        />
        <GroupFileCloud
          conversationId={conversationId}
          userId={userId}
          cloudMessages={cloudMessages}
        />
        <GroupLinksCloud
          conversationId={conversationId}
          userId={userId}
          cloudMessages={cloudMessages}
        />
      </div>
    </div>
  );
};

export default ChatInfoCloud;
