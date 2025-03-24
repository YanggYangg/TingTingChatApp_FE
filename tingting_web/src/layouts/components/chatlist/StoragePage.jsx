import { useState, useEffect } from "react";
import axios from "axios";
import { FaCalendarAlt } from "react-icons/fa";

const StoragePage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [data, setData] = useState({ images: [], files: [], links: [] });
const chatId = "67e0eda53261750c58989c24";

  useEffect(() => {
    if (!chatId) return;
    
    const fetchData = async () => {
      try {
        const [imagesRes, filesRes, linksRes] = await Promise.all([
          axios.get(`http://localhost:5000/messages/${chatId}/media`),
          axios.get(`http://localhost:5000/messages/${chatId}/files`),
          axios.get(`http://localhost:5000/messages/${chatId}/links`),
        ]);

        setData({
          images: imagesRes.data.filter(item => item.message.messageType === "image").map(item => ({
            url: item.message.linkURL,
            date: item.createdAt.split("T")[0],
            sender: item.message.userId,
          })),
          files: filesRes.data.filter(item => item.message.messageType === "file").map(item => ({
            name: item.message.content,
            url: item.message.linkURL,
            date: item.createdAt.split("T")[0],
            sender: item.message.userId,
          })),
          links: linksRes.data.filter(item => item.message.messageType === "link").map(item => ({
            title: item.message.content,
            url: item.message.linkURL,
            date: item.createdAt.split("T")[0],
            sender: item.message.userId,
          })),
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, [chatId]);

  const getUniqueSenders = () => ["Tất cả", ...new Set(data[activeTab].map(item => item.sender))];

  const filteredData = data[activeTab].filter(item =>
    (filterSender === "Tất cả" || item.sender === filterSender) &&
    (!startDate || new Date(item.date) >= new Date(startDate)) &&
    (!endDate || new Date(item.date) <= new Date(endDate))
  );

  return (
    <div className="absolute right-0 top-0 h-full w-[410px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={onClose} className="text-blue-500">Trở về</button>
        <h1 className="text-xl font-bold text-center">Kho lưu trữ</h1>
      </div>
      <div className="flex border-b justify-between">
        {["images", "files", "links"].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 my-2">
        <select className="border p-1 rounded text-sm w-1/2" value={filterSender} onChange={(e) => setFilterSender(e.target.value)}>
          {getUniqueSenders().map(sender => (
            <option key={sender} value={sender}>{sender}</option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        {[...new Set(filteredData.map(item => item.date))].map(date => (
          <div key={date} className="mt-4">
            <h2 className="font-bold text-base text-gray-700">Ngày {date}</h2>
            <div className={`grid ${activeTab === "images" ? "grid-cols-4" : "grid-cols-1"} gap-2 mt-2`}>
              {filteredData.filter(item => item.date === date).map((item, index) => (                                           
                <div key={index}>
                  {activeTab === "images" && item.url && (
                    <img src={item.url} alt="Hình ảnh" className="h-20 w-20 object-cover" />
                  )}
                  {activeTab === "files" && item.name && (
                    <p className="text-sm text-gray-600 truncate border p-2 rounded">{item.name}</p>
                  )}
                  {activeTab === "links" && item.url && (
                    <a href={item.url} className="text-blue-500 text-base font-medium block text-left break-words border p-2 rounded w-full">{item.url}</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoragePage;
