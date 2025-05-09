"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import ContactItem from "../ContactItem";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectConversation, setSelectedMessage } from '../../../../redux/slices/chatSlice.js'; 
// import ContactItem from "@/components/ContactItem";

import Search from "../Search";
import { Api_FriendRequest } from "../../../../../apis/api_friendRequest.js";
import { Api_Conversation } from "../../../../../apis/Api_Conversation.js";

const ContactList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState({});
  
  const [menuOpenId, setMenuOpenId] = useState(null); // Quản lý menu đang mở

  const [allFriends, setAllFriends] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' hoặc 'desc'

  const fetchFriends = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await Api_FriendRequest.getFriendsList(userId);
      console.log("====Danh sach ban be====", response);
      if (response?.data) {
        setAllFriends(response.data); // giả sử response.data là mảng friend
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  console.log("filtered", allFriends);

  useEffect(() => {
    //1. Lọc bb theo từ khóa tìm kiếm
    const filtered = searchQuery
      ? allFriends.filter((friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allFriends;

    //setFilteredFriends(filtered);
    // 2. Sắp xếp toàn bộ danh sách theo tên (A-Z hoặc Z-A)
    const sorted = [...filtered].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  
    setFilteredFriends(sorted);

// Nhóm theo chữ cái đầu
const groupedRaw = sorted.reduce((acc, friend) => {
  const firstLetter = friend.name.charAt(0).toUpperCase();
  if (!acc[firstLetter]) acc[firstLetter] = [];
  acc[firstLetter].push(friend);
  return acc;
}, {});

// Sắp xếp thứ tự các nhóm (chữ cái đầu)
const sortedGroupKeys = Object.keys(groupedRaw).sort((a, b) =>
  sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a)
);

// Tạo object mới có thứ tự đúng
const groupedSorted = {};
sortedGroupKeys.forEach((key) => {
  groupedSorted[key] = groupedRaw[key];
});

setGroupedFriends(groupedSorted); 
  }, [searchQuery, allFriends, sortOrder]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSortOpen(false);
      setFilterOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Prevent dropdown close when clicking inside
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Ẩn menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpenId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteFriend = async (friendId) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn huỷ kết bạn với người này không?"
    );
    if (!confirmDelete) return;
    try {
      const currentUserId = localStorage.getItem("userId");
      const response = await Api_FriendRequest.unfriend(
        currentUserId,
        friendId
      );
      console.log("====Xoa ban be====", response.data);
      await fetchFriends();
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  };

  const handleStartChat = async (friendId) => {
    const currentUserId = localStorage.getItem("userId");
    console.log("== CLICKED FRIEND ID ==", friendId); 
    console.log("== CURRENT USER ID ==", currentUserId);
    try{
      const res = await Api_Conversation.getOrCreateConversation(currentUserId, friendId);
      console.log("== RESPONSE từ API ==", res);


      if (res?.conversationId) {
        const conversationId = res.conversationId;
        console.log("== Đã lấy được conversationId ==", conversationId);
   // Dispatch để set selectedMessage
   dispatch(setSelectedMessage({
    id: conversationId,
    isGroup: false,
    participants: [
      { userId: currentUserId },
      { userId: friendId }
    ]
  }));

  console.log("== Navigating to /chat ==");
  navigate("/chat");
      }
    }catch (error) {
      console.error("Lỗi khi bắt đầu trò chuyện:", error);
    }
  }

  return (
    <div className="w-full h-full bg-white text-black flex flex-col ">
      <ContactItem
        label="Danh sách bạn bè"
        icon={faUser}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        <h2 className="pb-4 text-black font-medium">
          Bạn bè ({allFriends.length})
        </h2>

        <div className="w-full bg-white rounded-xs">
          <div className="w-full rounded-xs p-4 flex justify-between">
            <Search  value={searchQuery} onChange={setSearchQuery}
            />
            <div className="relative flex justify">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen(!sortOpen);
                  setFilterOpen(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-100 h-[40px] w-80 ml-4 active:border-blue-500 justify-between"
              >
                <span className="text-sm">Tên (A-Z)</span>
                <ChevronDown size={16} />
              </button>
              {sortOpen && (
                <div
                  className="absolute right-0 top-12 bg-white rounded-md shadow-lg z-10 w-[95%]"
                  onClick={handleDropdownClick}
                >
                  <button 
                  onClick={() => {
                    setSortOrder("asc");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Tên (A-Z)
                  </button>
                  <button 
                  onClick={() => {
                    setSortOrder("desc");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Tên (Z-A)
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterOpen(!filterOpen);
                  setSortOpen(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-100 h-[40px] w-80 ml-4 active:border-blue-500 justify-between"
              >
                <span className="text-sm">Tất cả</span>
                <ChevronDown size={16} />
              </button>
              {filterOpen && (
                <div
                  className="absolute right-0 top-12 bg-white rounded-md shadow-lg z-10 w-[95%]"
                  onClick={handleDropdownClick}
                >
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Tất cả
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Đang hoạt động
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Mới truy cập
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-full rounded-xs p-4">
            <div className="overflow-auto">
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col h-full p-4 text-center">
                  <p className="text-gray-600 font-medium">
                    Không tìm thấy kết quả nào
                  </p>
                  <p className="text-gray-500 text-sm">
                    Vui lòng thử tìm kiếm khác
                  </p>
                </div>
              ) : (
                Object.keys(groupedFriends)
                  .map((letter) => (
                    <div key={letter} className="">
                      {/* Nhóm DSBB theo chữ cái đầu */}
                      <div className="text-base font-medium">{letter}</div>
                      {/* Contacts under this letter */}
                      <div className="bg-white rounded-md">
                        {groupedFriends[letter].map((friend, index, array) => (
                          <ContactItem
                            key={friend._id}
                            label={friend.name}
                            image="https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg"
                            showBorder={index !== array.length - 1}
                            showMenuIcon={true}
                            menuOpen={menuOpenId === friend.id}
                            onDeleteFriend={() =>
                              handleDeleteFriend(friend._id)
                            }
                            onClick={() => handleStartChat(friend._id)}
                            // onMenuToggle={() =>
                            //   setMenuOpenId(
                            //     menuOpenId === friend.id ? null : friend.id
                            //   )
                            // }
                          />
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactList;
