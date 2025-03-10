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

const ContactList = () => {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [groupedFriends, setGroupedFriends] = useState({});

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
        href="/chat"
        label="Danh sách bạn bè"
        icon={faUser}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        <h2 className="pb-4 text-black font-medium">Bạn bè (100) </h2>
        <div className="w-full h-full bg-white rounded-xs">
          <div className="w-full h-full rounded-xs p-4 flex justify-between">
            <Search />
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen(!sortOpen);
                  setFilterOpen(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-100 h-[40px] w-80 ml-4"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-100 h-[40px] w-80 ml-4"
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
        </div>
      </div>
    </div>
  );
};

export default ContactList;
