import { useState, useEffect, useMemo } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { FaRegFolderOpen, FaDownload } from "react-icons/fa";

const StoragePage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [data, setData] = useState({ images: [], files: [], links: [] });
  const [fullScreenImage, setFullScreenImage] = useState(null);
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

  const filteredData = useMemo(() =>
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

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      const fallbackLink = document.createElement("a");
      fallbackLink.href = url;
      fallbackLink.download = filename;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    }
  };

  const handleDownloadFile = (file) => {
    if (!file?.url) {
      console.error("Không có link file để tải.");
      return;
    }

    const link = document.createElement("a");
    link.href = file.url;
    link.setAttribute("download", file.content || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const DateFilter = ({ showDateSuggestions, setShowDateSuggestions, handleDateFilter, startDate, setStartDate, endDate, setEndDate }) => (
    <div className="p-2 border rounded bg-white shadow-lg">
      <button
        className="w-full text-left p-2 font-semibold text-sm" // Chữ nhỏ hơn
        onClick={() => setShowDateSuggestions(!showDateSuggestions)}
      >
        Gợi ý thời gian
      </button>
      {showDateSuggestions && [7, 30, 90].map((days) => (
        <button
          key={days}
          className="block w-full p-2 text-left hover:bg-gray-200 text-sm" // Chữ nhỏ hơn
          onClick={() => handleDateFilter(days)}
        >
          {days} ngày trước
        </button>
      ))}
      <div className="mt-2">
        <p className="text-sm">Chọn khoảng thời gian</p>
        <div className="flex gap-2 mt-2">
          {[startDate, endDate].map((date, index) => (
            <div key={index} className="relative w-1/2">
              <FaCalendarAlt className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="date"
                className="border p-1 pl-8 rounded text-xs w-full" // Chữ nhỏ hơn
                value={date}
                onChange={(e) => index === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DateSection = ({ date, data, activeTab }) => (
    <div className="mt-4">
      <h2 className="font-bold text-sm text-gray-700">Ngày {date.split("-").reverse().join(" Tháng ")}</h2>
      <div className={`grid ${activeTab === "images" ? "grid-cols-4" : "grid-cols-1"} gap-2 mt-2`}>
        {data.filter((item) => item.date === date).map((item, index) => (
          <div key={index}>
            {activeTab === "images" ? (
              <img
                src={item.url}
                alt={item.name}
                className="h-20 w-20 object-cover cursor-pointer"
                onClick={() => setFullScreenImage(item)}
              />
            ) : activeTab === "files" ? (
              <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm font-semibold"
                >
                  {item.name || "Không có tên"}
                </a>
                <div className="flex gap-2">
                  {/* Nút mở file */}
                  <button className="text-gray-500 hover:text-blue-500">
                    <FaRegFolderOpen size={18} />
                  </button>
                  {/* Nút tải xuống */}
                  <button
                    className="text-gray-500 hover:text-blue-500"
                    onClick={() => handleDownloadFile(item)}
                  >
                    <FaDownload size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <a
                    href={item.url}
                    className="text-blue-500 text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.url}
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute right-0 top-0 h-full w-[410px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={onClose} className="text-blue-500 text-sm">Trở về</button> {/* Chữ nhỏ hơn */}
        <h1 className="text-lg font-bold">Kho lưu trữ</h1> {/* Chữ nhỏ hơn */}
        <button className="text-blue-500 text-sm">Chọn</button> {/* Chữ nhỏ hơn */}
      </div>

      <div className="flex border-b justify-between">
        {["images", "files", "links"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium text-sm ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`} // Chữ nhỏ hơn
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
          </button>
        ))}
      </div>

      {fullScreenImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative flex bg-white rounded-lg shadow-lg">
            <div className="relative flex items-center justify-center w-[60vw] h-[90vh] p-4">
              <img
                src={fullScreenImage.url}
                alt={fullScreenImage.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
              <button
                className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                onClick={() => setFullScreenImage(null)}
              >
                ✖
              </button>
              <button
                onClick={() => downloadImage(fullScreenImage.url, fullScreenImage.name)}
                className="absolute bottom-2 right-2 bg-white px-4 py-2 rounded text-sm text-gray-800 hover:bg-gray-200"
              >
                ⬇ Tải xuống
              </button>
            </div>
            <div className="w-40 h-[90vh] bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {data.images.map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={img.name}
                  className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${fullScreenImage.url === img.url ? "opacity-100 border-2 border-blue-400" : "opacity-50 hover:opacity-100"
                    }`}
                  onClick={() => setFullScreenImage(img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 my-2">
        <select
          className="border p-1 rounded text-sm w-1/2"
          value={filterSender}
          onChange={(e) => setFilterSender(e.target.value)}
        >
          {getUniqueSenders().map((sender) => (
            <option key={sender} value={sender}>{sender}</option>
          ))}
        </select>
        <button
          className="border p-1 rounded text-sm w-1/2"
          onClick={() => setShowDateFilter(!showDateFilter)}
        >
          Ngày gửi
        </button>
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

export default StoragePage;