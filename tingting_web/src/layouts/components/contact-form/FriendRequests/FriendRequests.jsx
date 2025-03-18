import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

import ContactItem from "../ContactItem";
import Search from "../Search";
import FriendSuggestionCard from "../FriendSuggestionCard/FriendSuggestionCard";

const FriendRequests = () => {
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      name: "Võ Trần Quốc Bảo",
      mutualFriends: 10,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "Trần Văn Lợi",
      mutualFriends: 9,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      name: "Như Ý",
      mutualFriends: 8,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 4,
      name: "Kiên Thức",
      mutualFriends: 6,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 5,
      name: "Nguyễn Công Hậu",
      mutualFriends: 6,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 6,
      name: "Phạm Hoàng Phi",
      mutualFriends: 6,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 7,
      name: "Trần Thị Thanh Tuyền",
      mutualFriends: 6,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 8,
      name: "Trần Lộc",
      mutualFriends: 4,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 9,
      name: "Đức",
      mutualFriends: 2,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 10,
      name: "Lê Thành Đạt",
      mutualFriends: 2,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 11,
      name: "Lê Văn Vinh",
      mutualFriends: 2,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 12,
      name: "N V Vinh",
      mutualFriends: 2,
      avatar: "/placeholder.svg?height=80&width=80",
    },
  ]);

  const [pendingRequests, setPendingRequests] = useState([]);

  const handleIgnore = (id) => {
    setSuggestions(suggestions.filter((suggestion) => suggestion.id !== id));
  };

  const handleAddFriend = (id) => {
    setSuggestions(suggestions.filter((suggestion) => suggestion.id !== id));
    // In a real app, you would send a friend request here
  };

  return (
    <div className="w-full h-full bg-white text-black flex flex-col">
      <ContactItem
        label="Danh sách bạn bè"
        icon={faUser}
        className="hover:bg-white cursor-default "
      />
      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        {pendingRequests.length === 0 ? (
          <div></div>
        ) : (
          <div className="mb-8">{/* Pending requests would go here */}</div>
        )}

        <div className="mt-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium">
              Gợi ý kết bạn ({suggestions.length})
            </h2>
            <button className="ml-2 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <FriendSuggestionCard
                key={suggestion.id}
                id={suggestion.id}
                name={suggestion.name}
                mutualFriends={suggestion.mutualFriends}
                avatar={suggestion.avatar}
                onIgnore={handleIgnore}
                onAddFriend={handleAddFriend}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
