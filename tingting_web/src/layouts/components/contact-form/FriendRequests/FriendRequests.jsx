//socket
import socket1 from "../../../../utils/socket.js";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import ContactItem from "../ContactItem";
import FriendSuggestionCard from "../FriendSuggestionCard/FriendSuggestionCard";
import { Api_FriendRequest } from "../../../../../apis/api_friendRequest.js";
import { Api_Profile } from "../../../../../apis/api_profile.js";

const FriendRequests = () => {
  const userId = localStorage.getItem("userId");
  const [suggestions, setSuggestions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  
  const fetchPendingRequests = async () => {
    try {
      const response = await Api_FriendRequest.getReceivedRequests(userId);
      setPendingRequests(response.data);
       // Cập nhật lên SidebarCompo
    const event = new CustomEvent("updateFriendRequestCount", {
      detail: response.data.length,
    });
    window.dispatchEvent(event);
    } catch (error) {
      console.error("Lỗi khi lấy lời mời kết bạn:", error);
    }
  };
  useEffect(() => {
    fetchPendingRequests();
  }, [userId]);

  const handleIgnore = (id) => {
    setSuggestions(suggestions.filter((suggestion) => suggestion._id !== id));
  };

  const handleAddFriend = async (id) => {
    try {
      const data = {
        senderId: userId,
        recipientId: id,
      };
      await Api_FriendRequest.sendFriendRequest(data);
      setSuggestions(suggestions.filter((suggestion) => suggestion._id !== id));
    } catch (error) {
      console.error("Lỗi khi gửi lời mời kết bạn:", error);
    }
  };

    //Lắng nghe sự kiện từ server khi có lời mời kết bạn mới
  useEffect(() => {
    socket1.on("friend_request_received", (data) => {
      console.log("Lời mời kết bạn mới từ", data.fromUserId);
      fetchPendingRequests(); // Cập nhật lại danh sách mời kết bạn
    });

     socket1.on("friend_request_revoked", (data) => {
    console.log("🔄 Lời mời kết bạn đã bị thu hồi từ", data.fromUserId);
    fetchPendingRequests(); // cập nhật lại danh sách lời mời
  });


    fetchPendingRequests(); // Lấy danh sách mời kết bạn ngay khi component mount

    return () => {
      socket1.off("friend_request_received"); // Dọn dẹp khi component unmount
      socket1.off("friend_request_revoked"); // Dọn dẹp khi component unmount
    };
  }, [userId]);

  // const handleRespondToRequest = async (requestId, action) => {
  //   try {
  //     await Api_FriendRequest.respondToFriendRequest({
  //       requestId,
  //       action,
  //       userId,
  //     });
  //     //setPendingRequests(pendingRequests.filter((req) => req._id !== requestId));
  //     await fetchPendingRequests(); //update ds lai tu BE
  //   } catch (error) {
  //     console.error(
  //       `Lỗi khi ${
  //         action === "accepted" ? "chấp nhận" : "từ chối"
  //       } lời mời kết bạn:`,
  //       error
  //     );
  //   }
  // };


  const handleRespondToRequest = (requestId, action) => {
  socket1.emit("respond_friend_request", {
    requestId,
    action,
    userId,
  }, (response) => {
    if (response.status === "accepted" || response.status === "rejected") {
      console.log(`✅ Đã ${action} lời mời`);
      fetchPendingRequests(); // cập nhật lại danh sách
    } else {
      console.error("❌ Lỗi phản hồi lời mời:", response.message);
    }
  });
};



  return (
    <div className="w-full h-full bg-white text-black flex flex-col">
      <ContactItem
        label="Lời mời kết bạn"
        icon={faUser}
        className="hover:bg-white cursor-default"
      />
     <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
  {pendingRequests.length > 0 ? (
    <div className="mb-8">
      <h2 className="text-black font-medium mb-4">
        Lời mời kết bạn ({pendingRequests.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingRequests.map((request) => (
          <FriendSuggestionCard
            key={request._id}
            id={request._id}
            name={`${request.requester.firstname} ${request.requester.surname}`}
            avatar={request.requester.avatar}
            type="request"
            onAccept={() => handleRespondToRequest(request._id, "accepted")}
            onReject={() => handleRespondToRequest(request._id, "rejected")}
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="text-center text-gray-600 italic">
      Chưa có lời mời kết bạn nào.
    </div>
  )}
</div>
    </div>
  );
};

export default FriendRequests;