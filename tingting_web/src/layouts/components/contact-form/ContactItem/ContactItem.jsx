import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ContactItem.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MoreVertical } from "lucide-react";
import { faTrash } from "@fortawesome/free-solid-svg-icons"; 

const cx = classNames.bind(styles);

const ContactItem = ({
  onClick,
  icon,
  image,
  label,
  className,
  showBorder,
  menuOpen,
  //onMenuToggle,
  onDeleteFriend,
  showMenuIcon, // Thêm prop để kiểm soát hiển thị nút ba chấm
  isSelected,
}) => {
  return (
    <div
      className={cx(
        "wrapper",
        "contact-item",
        { selected: isSelected },
        className,
        {
          "border-b border-gray-300": showBorder,
        }
      )}
      onClick={onClick}
    >
      <div
        className={cx(
          "flex items-center px-2 py-4 text-black font-medium hover:bg-gray-200 transition relative",
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
        {label}

        {/* Chỉ hiển thị nút ba chấm nếu showMenuIcon = true */}
        {showMenuIcon && (
          <button
            className="ml-auto p-2 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();//ngan click lan len
              // onMenuToggle();
              onDeleteFriend();
            }}
          >
            {/* <MoreVertical size={18} /> */}
            <FontAwesomeIcon icon={faTrash} className="text-red-500" />
          </button>
        )}

        {/* Dropdown menu
        {menuOpen && (
          <div className="absolute right-4 top-10 bg-white shadow-md rounded-md p-2 w-40 z-10">
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
              Xem chi tiết
            </button>
            <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
              Nhắn tin
            </button>
            <button className="block w-full text-left px-3 py-2 text-red-500 hover:bg-red-100 text-sm">
              Xóa bạn
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ContactItem;
