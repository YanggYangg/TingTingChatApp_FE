import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./GroupItem.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MoreVertical } from "lucide-react";

const cx = classNames.bind(styles);

const GroupItem = ({
  onClick,
  icon,
  image,
  label,
  memberCount, // Nhận số lượng thành viên từ props
  className,
  showBorder,
  menuOpen,
  onMenuToggle,
  showMenuIcon,
}) => {
  return (
    <div
      className={cx("wrapper", className, {
        "border-b border-gray-300": showBorder,
      })}
      onClick={onClick}
    >
      <div
        className={cx(
          "flex items-center px-3 py-4 text-black-700 font-medium hover:bg-gray-200 transition relative",
          className
        )}
      >
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-12 w-12 mr-4 ml-2 rounded-full object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={icon} className="h-5 w-10 pr-1" />
        )}

        {/* Tên nhóm và số thành viên */}
        <div className="flex flex-col">
          <span>{label}</span>
          <span className="text-sm text-gray-500">
            {memberCount} thành viên
          </span>
        </div>

        {/* Nút ba chấm */}
        {showMenuIcon && (
          <button
            className="ml-auto p-2 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
          >
            <MoreVertical size={18} />
          </button>
        )}

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-4 top-10 bg-white shadow-md rounded-md p-2 w-40 z-10">
            <button 
            className="block w-full text-left px-3 py-2 text-red-500 hover:bg-red-100 text-sm"
            onClick={() => console.log("Rời nhóm")}
            >
              Rời nhóm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupItem;
