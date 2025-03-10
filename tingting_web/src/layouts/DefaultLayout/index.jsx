import classNames from "classnames";
import { Outlet } from "react-router-dom";
import styles from "./DefaultLayout.module.scss";

import Sidebar from "../components/sidebar";
import ChatList from "../components/chatlist";
import Contact from "../components/contact-form/Contact";

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
  return (
    <div className="flex h-screen">
      <div className="w-[80px] bg-blue-600 text-white flex-shrink-0">
        <Sidebar />
      </div>

      <div className="w-full bg-green-500 text-white flex-shrink-0 flex-1">
        <Contact />
      </div>

      {/* <div className="flex-1 p-4 bg-white" >
                <Outlet />  
            </div> */}
    </div>
  );
}

export default DefaultLayout;
