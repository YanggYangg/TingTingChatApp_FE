import React from 'react';
import { Link } from "react-router-dom";


function SidebarItem({ icon: Icon, badge, active, to }){
    return(
        <Link to={to} className="relative flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-blue-700">
            <Icon className="w-10 h-10 text-white" />
            {badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default SidebarItem;