import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

import ContactItem from "../ContactItem";
import GroupItem from "../GroupItem";
import Search from "../Search";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { selectConversation, setSelectedMessage } from '../../../../redux/slices/chatSlice.js'; 

import { Api_Conversation } from "../../../../../apis/Api_Conversation";

const GroupList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState({});
  const [menuOpenId, setMenuOpenId] = useState(null); // Quản lý menu đang mở

  const [groupList, setGroupList] = useState([]); 
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupedGroups, setGroupedGroups] = useState({});
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" = A-Z, "desc" = Z-A


  const userId = localStorage.getItem("userId");

  const sortGroupsByName = (groups, order = "asc") => {
    return [...groups].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      if (order === "asc") return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
    });
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await Api_Conversation.getUserJoinGroup(userId);
        console.log("Full response:", res);
        setGroupList(res); 
        
      } catch (error) {
        console.error("Lỗi khi lấy nhóm người dùng tham gia:", error);
        setGroupList([]); // Tránh undefined gây lỗi reduce
      }
    };

    if (userId) fetchGroups();
  }, [userId]);

   // 🎯 Lọc và nhóm nhóm theo tên
   useEffect(() => {
    const filtered = searchQuery
      ? groupList.filter((group) =>
          group.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groupList;

    //setFilteredGroups(filtered);
    const sorted = sortGroupsByName(filtered, sortOrder);
    setFilteredGroups(sorted);

    const grouped = sorted.reduce((acc, group) => {
      const firstLetter = group.name?.charAt(0).toUpperCase() || "#";
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(group);
      return acc;
    }, {});

    setGroupedGroups(grouped);
  }, [searchQuery, groupList, sortOrder]);


  console.log("groupList", groupList);



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

  const handleStartChat = async (group) => {
    try {
      const conversationId = group._id; // dùng luôn ID của group làm conversationId
      console.log("== Navigating to group conversation ==", conversationId);
  
      dispatch(setSelectedMessage({
        id: conversationId,
        isGroup: true,
        participants: group.participants,
        name: group.name,
        imageGroup: group.imageGroup || ""  // nếu có ảnh nhóm
      }));
  
      navigate("/chat");
    } catch (error) {
      console.error("Lỗi khi bắt đầu trò chuyện nhóm:", error);
    }
  };
  

  return (
    <div className="w-full h-full bg-white text-black flex flex-col ">
      <ContactItem
        label="Danh sách nhóm và cộng đồng"
        icon={faUsers}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        <h2 className="pb-4 text-black font-medium">Nhóm và cộng đồng ({groupList.length})</h2>
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
              {/* {filterOpen && (
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
              )} */}
            </div>
          </div>
          <div className="w-full h-full rounded-xs p-4">
            <div className="overflow-auto">
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col h-full p-4 text-center">
                  <p className="text-gray-600 font-medium">
                    Không tìm thấy kết quả nào
                  </p>
                  <p className="text-gray-500 text-sm">
                    Vui lòng thử tìm kiếm khác
                  </p>
                </div>
              ) : (
                Object.keys(groupedGroups)
                  .map((letter) => (
                    <div key={letter}>
                      {groupedGroups[letter].map((group, index, array) => (
                        <GroupItem
                          memberCount={group.participants.length} 
                          key={group._id}
                          label={group.name}
                          image="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/08/hinh-nen-lap-top-cute-74.jpg"
                          showBorder={index !== array.length - 1}
                          showMenuIcon={true}
                          menuOpen={menuOpenId === group._id}
                          onMenuToggle={() =>
                            setMenuOpenId(
                              menuOpenId === group._id ? null : group._id
                            )
                          }
                          onClick={() => handleStartChat(group)}
                        />
                      ))}
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

export default GroupList;
