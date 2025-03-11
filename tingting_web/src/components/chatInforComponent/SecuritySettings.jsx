// SecuritySettings.jsx
const SecuritySettings = () => {
    return (
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Thiết lập bảo mật</h3>
  
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Tin nhắn tự xóa</span>
          <span className="text-xs text-gray-500">Chỉ dành cho trưởng hoặc phó nhóm</span>
        </div>
  
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Ẩn trò chuyện</span>
          <input type="checkbox" className="toggle-checkbox" />
        </div>
  
        <button className="w-full text-red-500 text-left mt-2">⚠️ Báo xấu</button>
        <button className="w-full text-red-500 text-left mt-2">🗑 Xóa lịch sử trò chuyện</button>
        <button className="w-full text-red-500 text-left mt-2">🚪 Rời nhóm</button>
      </div>
    );
  };
  
  export default SecuritySettings;
  