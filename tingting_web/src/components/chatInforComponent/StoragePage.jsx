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
        const [images, files, links] = await Promise.all([
          Api_chatInfo.getChatMedia(chatId),
          Api_chatInfo.getChatFiles(chatId),
          Api_chatInfo.getChatLinks(chatId),
        ]);

        setData({
          images: formatData(images),
          files: formatData(files),
          links: formatData(links),
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };
    fetchData();
  }, [chatId]);

  const formatData = (items) =>
    (Array.isArray(items) ? items : []).map(({ linkURL, createdAt, userId, content }) => ({
      url: linkURL || "#",
      date: createdAt?.split("T")[0] || "",
      sender: userId?.name || "Không tên",
      name: content || "Không có tên",
    }));

  const filteredData = useMemo(
    () =>
      (data[activeTab] || []).filter(
        ({ sender, date }) =>
          (filterSender === "Tất cả" || sender === filterSender) &&
          (!startDate || new Date(date) >= new Date(startDate)) &&
          (!endDate || new Date(date) <= new Date(endDate))
      ),
    [data, activeTab, filterSender, startDate, endDate]
  );
  const getUniqueSenders = () => ["Tất cả", ...new Set(data[activeTab].map(item => item.sender))];
  const handleDateFilter = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[410px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={onClose} className="text-blue-500">Trở về</button>
        <h1 className="text-xl font-bold">Kho lưu trữ</h1>
        <button className="text-blue-500">Chọn</button>
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
      <div className="flex gap-2 my-2">
        <select className="border p-1 rounded text-sm w-1/2" value={filterSender} onChange={(e) => setFilterSender(e.target.value)}>
          {getUniqueSenders().map((sender) => (
            <option key={sender} value={sender}>{sender}</option>
          ))}
        </select>
        <button className="border p-1 rounded text-sm w-1/2" onClick={() => setShowDateFilter(!showDateFilter)}>Ngày gửi</button>
      </div>
      {showDateFilter && (
        <DateFilter
          showDateSuggestions={showDateSuggestions}
          setShowDateSuggestions={setShowDateSuggestions}
          handleDateFilter={handleDateFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}
      <div className="mt-4">
        {[...new Set(filteredData.map(({ date }) => date))].map((date) => (
          <DateSection key={date} date={date} data={filteredData} activeTab={activeTab} />
        ))}
      </div>
    </div>
  );
};

const DateFilter = ({ showDateSuggestions, setShowDateSuggestions, handleDateFilter, startDate, setStartDate, endDate, setEndDate }) => (
  <div className="p-2 border rounded bg-white shadow-lg">
    <button className="w-full text-left p-2 font-semibold" onClick={() => setShowDateSuggestions(!showDateSuggestions)}>Gợi ý thời gian</button>
    {showDateSuggestions && [7, 30, 90].map((days) => (
      <button key={days} className="block w-full p-2 text-left hover:bg-gray-200" onClick={() => handleDateFilter(days)}>{days} ngày trước</button>
    ))}
    <div className="mt-2">
      <p className="text-sm">Chọn khoảng thời gian</p>
      <div className="flex gap-2 mt-2">
        {[startDate, endDate].map((date, index) => (
          <div key={index} className="relative w-1/2">
            <FaCalendarAlt className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input type="date" className="border p-1 pl-8 rounded text-sm w-full" value={date} onChange={(e) => (index === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value))} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DateSection = ({ date, data, activeTab }) => (
  <div className="mt-4">
    <h2 className="font-bold text-base text-gray-700">Ngày {date.split("-").reverse().join(" Tháng ")}</h2>
    <div className={`grid ${activeTab === "images" ? "grid-cols-4" : "grid-cols-1"} gap-2 mt-2`}>
      {data.filter((item) => item.date === date).map((item, index) => (
        <div key={index}>
          {activeTab === "images" ? <img src={item.url} alt="Hình ảnh" className="h-20 w-20 object-cover" /> :
          activeTab === "files" ? <p className="text-sm text-gray-600 truncate border p-2 rounded">{item.name}</p> :
          <a href={item.url} className="text-blue-500 text-base font-medium block text-left break-words border p-2 rounded w-full">{item.url}</a>}
        </div>
      ))}
    </div>
  </div>
);

export default StoragePage;
