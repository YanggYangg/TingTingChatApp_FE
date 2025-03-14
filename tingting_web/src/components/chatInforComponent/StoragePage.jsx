import { useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

const StoragePage = () => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);

  const rawData = {
    images: [
      { url: "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg", date: "2024-03-13", sender: "Nhi" },
      { url: "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg", date: "2024-03-13", sender: "Giang" },
      { url: "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg", date: "2024-03-11", sender: "Hậu" },
    ],
    files: [
      { name: "Tài liệu 1.pdf", date: "2024-03-08", sender: "Bạn A" },
      { name: "Báo cáo.docx", date: "2024-03-07", sender: "Bạn B" },
    ],
    links: [
      { url: "https://example.com", date: "2024-03-07", sender: "Bạn A" },
      { url: "https://reactjs.org", date: "2024-03-06", sender: "Bạn B" },
    ],
  };

  const getUniqueSenders = () => ["Tất cả", ...new Set(rawData[activeTab].map(item => item.sender))];

  const handleDateFilter = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const filteredData = rawData[activeTab].filter(item => 
    (filterSender === "Tất cả" || item.sender === filterSender) && 
    (!startDate || new Date(item.date) >= new Date(startDate)) && 
    (!endDate || new Date(item.date) <= new Date(endDate))
  );

  return (
    <div className="absolute right-0 top-0 h-full w-[350px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={() => window.history.back()} className="text-blue-500">Trở về</button>
        <h1 className="text-xl font-bold text-center">Kho lưu trữ</h1>
        <button className="text-blue-500">Chọn</button>
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
        <button className="border p-1 rounded text-sm w-1/2" onClick={() => setShowDateFilter(!showDateFilter)}>
          Ngày gửi
        </button>
      </div>
      
      {showDateFilter && (
        <div className="p-2 border rounded bg-white shadow-lg">
          <button className="w-full text-left p-2 font-semibold" onClick={() => setShowDateSuggestions(!showDateSuggestions)}>
            Gợi ý thời gian
          </button>
          {showDateSuggestions && (
            <div>
              {[7, 30, 90].map(days => (
                <button key={days} className="block w-full p-2 text-left hover:bg-gray-200" onClick={() => handleDateFilter(days)}>
                  {days} ngày trước
                </button>
              ))}
            </div>
          )}
          <div className="mt-2">
            <p className="text-sm">Chọn khoảng thời gian</p>
            <div className="flex gap-2 mt-2">
              {[startDate, endDate].map((date, index) => (
                <div key={index} className="relative w-1/2">
                  <FaCalendarAlt className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="date" 
                    className="border p-1 pl-8 rounded text-sm w-full" 
                    value={date} 
                    onChange={(e) => index === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        {[...new Set(filteredData.map(item => item.date))].map(date => (
          <div key={date} className="mt-4">
          <h2 className="font-bold text-base text-gray-700">Ngày {date.split("-").reverse().join(" Tháng ")}</h2>

            <div className={`grid ${activeTab === "images" ? "grid-cols-4" : "grid-cols-1"} gap-2 mt-2`}>
              {filteredData.filter(item => item.date === date).map((item, index) => (
                <div key={index} >
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