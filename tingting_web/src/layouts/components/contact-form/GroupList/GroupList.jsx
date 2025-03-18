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

const GroupList = () => {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState({});

  // Sample friends data
  const allFriends = [
    { id: 1, name: "A2", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 2, name: "An", avatar: "/placeholder.svg?height=40&width=40" },
    {
      id: 3,
      name: "An Quốc Việt",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    { id: 4, name: "Anh Khoa", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 5, name: "Anh Thư", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 6, name: "Ba", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 7, name: "Bảo Châu", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 8, name: "Bảo Trân", avatar: "/placeholder.svg?height=40&width=40" },
    {
      id: 9,
      name: "Bảoo Ngocc",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 10,
      name: "Bích Phương",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ];

  // Filter and group friends when search query changes
  useEffect(() => {
    // Filter friends based on search query
    const filtered = searchQuery
      ? allFriends.filter((friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allFriends;

    setFilteredFriends(filtered);

    // Group friends by first letter
    const grouped = filtered.reduce((acc, friend) => {
      const firstLetter = friend.name.charAt(0).toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(friend);
      return acc;
    }, {});

    setGroupedFriends(grouped);
  }, [searchQuery]);

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

  return (
    <div className="w-full h-full bg-white text-black flex flex-col ">
      <ContactItem
        label="Danh sách nhóm và cộng đồng"
        icon={faUsers}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        <h2 className="pb-4 text-black font-medium">Nhóm và cộng đồng (100)</h2>
        <div className="w-full bg-white rounded-xs">
          <div className="w-full rounded-xs p-4 flex justify-between">
            <Search />
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
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                    Tên (A-Z)
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
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
                  .sort()
                  .map((letter) => (
                    <div key={letter}>
                      {groupedFriends[letter].map((friend) => (
                        <ContactItem
                          key={friend.id}
                          label={friend.name}
                          image="https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg"
                          // showBorder={index !== arr.length - 1}
                          // showBorder={true}
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
