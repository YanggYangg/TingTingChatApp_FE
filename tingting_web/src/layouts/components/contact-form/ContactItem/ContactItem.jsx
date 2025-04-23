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
            <FontAwesomeIcon icon={faTrash} className="text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactItem;
