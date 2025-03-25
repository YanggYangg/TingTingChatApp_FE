import { useState, useEffect, useMemo } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const StoragePage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [data, setData] = useState({ images: [], files: [], links: [] });
  const chatId = "67e2d6bef1ea6ac96f10bf91";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [imagesRes, filesRes, linksRes] = await Promise.all([
          Api_chatInfo.getChatMedia(chatId),
          Api_chatInfo.getChatFiles(chatId),
          Api_chatInfo.getChatLinks(chatId),
        ]);

        const imagesArray = Array.isArray(imagesRes) ? imagesRes : [];
        const filesArray = Array.isArray(filesRes) ? filesRes : [];
        const linksArray = Array.isArray(linksRes) ? linksRes : [];

        const newData = {
          images: imagesArray.map((item) => ({
            url: item.linkURL || "#",
            date: item.createdAt?.split("T")[0] || "",
            sender: item.userId || "Unknown",
          })),
          files: filesArray.map((item) => ({
            name: item.content || "Không có tên",
            url: item.linkURL || "#",
            date: item.createdAt?.split("T")[0] || "",
            sender: item.userId || "Unknown",
          })),
          links: linksArray.map((item) => ({
            title: item.content || "Không có tiêu đề",
            url: item.linkURL || "#",
            date: item.createdAt?.split("T")[0] || "",
            sender: item.userId || "Unknown",
          })),
        };

        setData(newData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    if (chatId) {
      fetchData();
    }
  }, [chatId]);

  const filteredData = useMemo(() => {
    return (data[activeTab] || []).filter(
      (item) =>
        (filterSender === "Tất cả" || item.sender === filterSender) &&
        (!startDate || new Date(item.date) >= new Date(startDate)) &&
        (!endDate || new Date(item.date) <= new Date(endDate))
    );
  }, [data, activeTab, filterSender, startDate, endDate]);

  return (
    <div className="absolute right-0 top-0 h-full w-[410px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={onClose} className="text-blue-500">Trở về</button>
        <h1 className="text-xl font-bold text-center">Kho lưu trữ</h1>
      </div>
      <div className="flex border-b justify-between">
        {["images", "files", "links"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTab === "images" ? (
          <div className="grid grid-cols-4 gap-2">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <div key={index} className="relative">
                  <img src={item.url} alt="Media" className="w-full h-20 object-cover rounded-md" />
                  <p className="text-xs text-gray-500 text-center mt-1">{item.date}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Không có dữ liệu</p>
            )}
          </div>
        ) : (
          filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <div key={index} className="border p-2 rounded mb-2">
                {activeTab === "files" && (
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <a href={item.url} className="text-blue-500" target="_blank" rel="noopener noreferrer">Tải xuống</a>
                  </div>
                )}
                {activeTab === "links" && (
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <a href={item.url} className="text-blue-500" target="_blank" rel="noopener noreferrer">Truy cập</a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">Không có dữ liệu</p>
          )
        )}
      </div>
    </div>
  );
};

export default StoragePage;