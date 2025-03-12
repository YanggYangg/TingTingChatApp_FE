import classNames from 'classnames';
import { Outlet, useLocation } from 'react-router-dom';
import { ChatProvider } from '../../hooks/ChatContext';
import { useState } from "react";


import styles from './DefaultLayout.module.scss';

import Sidebar from '../components/sidebar';
import ChatList from '../components/chatlist';

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.pathname)// 'chat' or 'contact'
    return (
        <ChatProvider>
        <div className="flex h-screen">
            <div className="w-[80px] bg-blue-600 text-white flex-shrink-0">
                <Sidebar setActiveTab={setActiveTab} />
            </div>

            <div className="w-[350px] text-white flex-shrink-0">
                <ChatList activeTab={activeTab} />
            </div>

            <div className="flex-1 p-4 bg-white" >
                <Outlet />  
            </div>
        </div>
        </ChatProvider>

    );
};

export default DefaultLayout;