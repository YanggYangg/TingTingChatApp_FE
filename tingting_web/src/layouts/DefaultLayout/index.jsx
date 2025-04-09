import classNames from "classnames";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChatProvider } from "../../hooks/ChatContext";
import { useState, useEffect } from "react";

import styles from "./DefaultLayout.module.scss";

import Sidebar from "../components/sidebar";
import Contact from "../components/contact-form/Contact";
import ChatList from "../components/chatlist";

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.pathname); // 'chat' or 'contact'

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/chat");
    } else {
      const basePath = location.pathname.startsWith("/contact")
        ? "/contact"
        : "/chat";
      setActiveTab(basePath);
    }
  }, [location.pathname, navigate]);

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="w-[60px] bg-blue-600 text-white flex-shrink-0">
          <Sidebar setActiveTab={setActiveTab} />
        </div>

        <div className="w-[350px] bg-white text-white flex-shrink-0">
          <ChatList activeTab={activeTab} />
        </div>

        <div className="flex-1 bg-white">
          <Outlet />
        </div>
      </div>
    </ChatProvider>
  );
}

export default DefaultLayout;
