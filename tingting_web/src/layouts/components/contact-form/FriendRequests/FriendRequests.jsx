// import {
//   faUser,
//   faUsers,
//   faUserPlus,
//   faUserGear,
// } from "@fortawesome/free-solid-svg-icons";
// import axios from "axios";
// import { ChevronDown } from "lucide-react";
// import { useState, useEffect } from "react";

// import ContactItem from "../ContactItem";
// import Search from "../Search";
// import FriendSuggestionCard from "../FriendSuggestionCard/FriendSuggestionCard";
// import { Api_FriendRequest } from "../../../../../apis/api_friendRequest.js";

// const FriendRequests = () => {
//   console.log("FriendRequests component rendered"); // Log 1
//   const userId = localStorage.getItem("userId");
//   console.log("userId from localStorage:", userId);
//   const [suggestions, setSuggestions] = useState([]);
//   const [pendingRequests, setPendingRequests] = useState([]);

//   useEffect(() => {
//     const fetchReceivedRequests = async () => {
//       try {
//         const res = await Api_FriendRequest.getReceivedRequests(userId);
//         console.log("Lời mời kết bạn đã nhận:", res.data);
//         setPendingRequests(res.data); // res.data là mảng các lời mời kết bạn đã nhận
//       } catch (error) {
//         console.error("Lỗi khi fetch lời mời kết bạn đã nhận:", error);
//       }
//     };
//     fetchReceivedRequests();
//   }, []);

//   //Button bỏ qua
//   const handleIgnore = (id) => {
//     setSuggestions(suggestions.filter((suggestion) => suggestion.id !== id));
//   };

//   //Button thêm bạn
//   // const handleAddFriend = (id) => {
//   //   setSuggestions(suggestions.filter((suggestion) => suggestion.id !== id));
//   //   // In a real app, you would send a friend request here
//   // };
//   const handleAddFriend = async (id) => {
//     try {
//       const data = {
//         senderId: userId,
//         recipientId: id,
//       };
//       await Api_FriendRequest.sendFriendRequest(data)

//       setSuggestions(suggestions.filter((suggestion) => suggestion._id !== id));
//     } catch (error) {
//       console.error("Lỗi khi gửi lời mời kết bạn:", error);
//     }
//   };
//   const handleRespondToRequest = async (requestId, action) => {
//     try {
//       await Api_FriendRequest.respondToFriendRequest({
//         requestId,
//         action,
//         userId,
//       });
//       setPendingRequests(pendingRequests.filter((req) => req._id !== requestId));
//     } catch (error) {
//       console.error(`Lỗi khi ${action === "accepted" ? "chấp nhận" : "từ chối"} lời mời kết bạn:`, error);
//     }
//   };

//   return (
//     <div className="w-full h-full bg-white text-black flex flex-col">
//       <ContactItem
//         label="Danh sách bạn bè"
//         icon={faUser}
//         className="hover:bg-white cursor-default "
//       />
//       <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
//         {pendingRequests.length === 0 ? (
//           <div></div>
//         ) : (
//           <div className="mb-8">{/* Pending requests would go here */}</div>
//         )}

//         <div className="mt-8">
//           <div className="flex items-center mb-4">
//             <h2 className=" text-black font-medium">
//               Gợi ý kết bạn ({suggestions.length})
//             </h2>
//             <button className="ml-2 text-blue-600">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {suggestions.map((suggestion) => (
//               <FriendSuggestionCard
//                 key={suggestion._id}
//                 id={suggestion._id}
//                 name={suggestion.name}
//                 //mutualFriends={suggestion.mutualFriends}
//                 avatar={suggestion.avatar}
//                 onIgnore={handleIgnore}
//                 onAddFriend={handleAddFriend}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FriendRequests;

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

  const handleRespondToRequest = async (requestId, action) => {
    try {
      await Api_FriendRequest.respondToFriendRequest({
        requestId,
        action,
        userId,
      });
      //setPendingRequests(pendingRequests.filter((req) => req._id !== requestId));
      await fetchPendingRequests(); //update ds lai tu BE
    } catch (error) {
      console.error(
        `Lỗi khi ${
          action === "accepted" ? "chấp nhận" : "từ chối"
        } lời mời kết bạn:`,
        error
      );
    }
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