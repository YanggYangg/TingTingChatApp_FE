import React from "react";
import { Link } from "react-router-dom";

function SidebarItem({ icon: Icon, badge, active, to, onClick, image  }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-blue-700 ${active ? 'bg-blue-800' : ''}`}
    >
      {image ? (
        <img
          src={image}
          alt="Sidebar avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <Icon className="w-8 h-8 text-white" />
      )}

      {badge && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default SidebarItem;
