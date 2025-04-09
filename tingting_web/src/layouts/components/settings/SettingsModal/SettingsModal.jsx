"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaCog,
  FaUserShield,
  FaLock,
  FaSync,
  FaDatabase,
  FaPalette,
  FaBell,
  FaComment,
  FaPhone,
  FaPuzzlePiece,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("account");

  // Close modal when clicking outside
  const modalRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-4xl h-[600px] flex rounded-md overflow-hidden"
      >
        {/* Left sidebar */}
        <div className="w-64 bg-white border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-medium text-black">Cài đặt</h2>
          </div>

          <div className="overflow-y-auto h-[calc(600px-57px)]">
            <MenuItem
              icon={<FaCog />}
              text="Cài đặt chung"
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
            <MenuItem
              icon={<FaUserShield />}
              text="Tài khoản và bảo mật"
              isActive={activeTab === "account"}
              onClick={() => setActiveTab("account")}
            />
            <MenuItem
              icon={<FaLock />}
              text="Quyền riêng tư"
              isActive={activeTab === "privacy"}
              onClick={() => setActiveTab("privacy")}
            />
            <MenuItem
              icon={<FaSync />}
              text="Đồng bộ tin nhắn"
              isActive={activeTab === "sync"}
              onClick={() => setActiveTab("sync")}
            />
            <MenuItem
              icon={<FaDatabase />}
              text="Quản lý dữ liệu"
              isActive={activeTab === "data"}
              onClick={() => setActiveTab("data")}
            />
            <MenuItem
              icon={<FaPalette />}
              text="Giao diện"
              isActive={activeTab === "interface"}
              onClick={() => setActiveTab("interface")}
              badge="Beta"
            />
            <MenuItem
              icon={<FaBell />}
              text="Thông báo"
              isActive={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            />
            <MenuItem
              icon={<FaComment />}
              text="Tin nhắn"
              isActive={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
            />
            <MenuItem
              icon={<FaPhone />}
              text="Cài đặt cuộc gọi"
              isActive={activeTab === "calls"}
              onClick={() => setActiveTab("calls")}
            />
            <MenuItem
              icon={<FaPuzzlePiece />}
              text="Tiện ích"
              isActive={activeTab === "utilities"}
              onClick={() => setActiveTab("utilities")}
            />
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 bg-gray-100">
          <div className="flex justify-between items-center p-4 border-b bg-white">
            <h3 className="text-lg font-medium text-black">
              {activeTab === "account" && "Tài khoản và bảo mật"}
              {activeTab === "general" && "Cài đặt chung"}
              {activeTab === "privacy" && "Quyền riêng tư"}
              {activeTab === "sync" && "Đồng bộ tin nhắn"}
              {activeTab === "data" && "Quản lý dữ liệu"}
              {activeTab === "interface" && "Giao diện"}
              {activeTab === "notifications" && "Thông báo"}
              {activeTab === "messages" && "Tin nhắn"}
              {activeTab === "calls" && "Cài đặt cuộc gọi"}
              {activeTab === "utilities" && "Tiện ích"}
            </h3>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="p-4">
            {activeTab === "account" && <AccountSecurityContent />}
            {activeTab === "general" && (
              <div className="text-black">Nội dung cài đặt chung</div>
            )}
            {activeTab === "privacy" && (
              <div className="text-black">Nội dung quyền riêng tư</div>
            )}
            {activeTab === "sync" && (
              <div className="text-black">Nội dung đồng bộ tin nhắn</div>
            )}
            {activeTab === "data" && (
              <div className="text-black">Nội dung quản lý dữ liệu</div>
            )}
            {activeTab === "interface" && (
              <div className="text-black">Nội dung giao diện</div>
            )}
            {activeTab === "notifications" && (
              <div className="text-black">Nội dung thông báo</div>
            )}
            {activeTab === "messages" && (
              <div className="text-black">Nội dung tin nhắn</div>
            )}
            {activeTab === "calls" && (
              <div className="text-black">Nội dung cài đặt cuộc gọi</div>
            )}
            {activeTab === "utilities" && (
              <div className="text-black">Nội dung tiện ích</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, text, isActive, onClick, badge }) {
  return (
    <div
      className={`flex items-center text-black px-4 py-3 cursor-pointer ${
        isActive ? "bg-blue-100 " : "hover:bg-gray-100"
      }`}
      onClick={onClick}
    >
      <span className="mr-3 text-lg">{icon}</span>
      <span className="flex-grow">{text}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-black rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

function SettingItem({ title, description, children, hasArrow }) {
  return (
    <div className="mb-6">
      <h4 className="font-medium mb-2">{title}</h4>
      {description && <p className="text-sm text-black mb-2">{description}</p>}
      <div className="flex items-center justify-between bg-white p-3 rounded">
        <div className="flex-grow">{children}</div>
        {hasArrow && <FaChevronRight className="text-gray-400" />}
      </div>
    </div>
  );
}

function Toggle({ isOn, onChange }) {
  return (
    <div
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-blue-600 justify-end" : "bg-gray-300 justify-start"
      }`}
      onClick={() => onChange(!isOn)}
    >
      <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
    </div>
  );
}

function AccountSecurityContent() {
  const [screenLock, setScreenLock] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="text-black">
      <h3 className="text-lg font-medium mb-4">Mật khẩu đăng nhập</h3>

      <SettingItem title="Đổi mật khẩu" hasArrow>
        <span>••••••••</span>
      </SettingItem>

      <h3 className="text-lg font-medium mb-4">Khóa màn hình Zalo</h3>

      <SettingItem
        title="Khóa màn hình Zalo"
        description="Khóa màn hình Zalo của bạn bằng Ctrl + L, khi bạn không sử dụng máy tính."
      >
        <div className="flex items-center justify-between">
          <span>{screenLock ? "Đã bật" : "Đã tắt"}</span>
          <Toggle isOn={screenLock} onChange={setScreenLock} />
        </div>
      </SettingItem>

      <h3 className="text-lg font-medium mb-4">Bảo mật 2 lớp</h3>

      <SettingItem title="Sau khi bật, bạn sẽ được yêu cầu nhập mã OTP hoặc xác thực từ thiết bị di động sau khi đăng nhập trên thiết bị lạ.">
        <div className="flex items-center justify-end">
          <Toggle isOn={twoFactor} onChange={setTwoFactor} />
        </div>
      </SettingItem>
    </div>
  );
}

export default SettingsModal;
