import { useState } from "react";

const StoragePage = () => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [filterDate, setFilterDate] = useState("Mới nhất");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const rawData = {
    images: [
      { url:  "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg", date: "2024-03-13", sender: "Bạn A" },
      { url: "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg", date: "2024-03-13", sender: "Bạn A" },
      { url: "https://phongvu.vn/cong-nghe/wp-content/uploads/2024/12/hinh-nen-cute-27-576x1024.jpg", date: "2024-03-11", sender: "Bạn B" },
      { url:  "https://i.pinimg.com/736x/74/2e/15/742e1531a34e2ea5a4c23e5bbcfa669f.jpg", date: "2024-03-09", sender: "Bạn A" },
    ],
    files: [
      { name: "Tài liệu 1.pdf", date: "2024-03-08", sender: "Bạn A" },
      { name: "Báo cáo.docx", date: "2024-03-07", sender: "Bạn B" },
      { name: "React.docx", date: "2024-03-07", sender: "Bạn B" },
    ],
    links: [
      { url: "https://example.com", date: "2024-03-07", sender: "Bạn A" },
      { url: "https://reactjs.org", date: "2024-03-06", sender: "Bạn B" },
      { url: "https://reactjs.org", date: "2024-03-06", sender: "Bạn A" },
    ],
  };

  const sortedData = rawData[activeTab].sort((a, b) => {
    return filterDate === "Mới nhất"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date);
  });

  const filteredData = filterSender === "Tất cả"
    ? sortedData
    : sortedData.filter((item) => item.sender === filterSender);

  const toggleSelect = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[350px] bg-white shadow-lg p-4 overflow-y-auto">
      <div className="flex justify-between mb-4">
        <button onClick={() => window.history.back()} className="text-blue-500">Trở về</button>
        <h1 className="text-xl font-bold text-center">Kho lưu trữ</h1>
        <button onClick={() => setIsSelecting(!isSelecting)} className="text-blue-500">{isSelecting ? "Hủy" : "Chọn"}</button>
      </div>
      
      <div className="flex border-b justify-between">
        {["images", "files", "links"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
          </button>
        ))}
      </div>

      <div className="flex justify-between my-2">
        <select className="border p-1 rounded text-sm" value={filterSender} onChange={(e) => setFilterSender(e.target.value)}>
          <option value="Tất cả">Tất cả</option>
          <option value="Bạn A">Bạn A</option>
          <option value="Bạn B">Bạn B</option>
        </select>
        <select className="border p-1 rounded text-sm" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
          <option value="Mới nhất">Mới nhất</option>
          <option value="Cũ nhất">Cũ nhất</option>
        </select>
      </div>
      {filteredData.length === 0 ? (
        <p className="text-center text-gray-500">Không có dữ liệu</p>
      ) : (
        Object.entries(
          filteredData.reduce((acc, item) => {
            acc[item.date] = acc[item.date] || [];
            acc[item.date].push(item);
            return acc;
          }, {})
        ).map(([date, items]) => (
          <div key={date} className="mb-4">
            <h2 className="font-semibold text-gray-600 mb-2">Ngày {new Date(date).toLocaleDateString("vi-VN")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, index) => (
                <div key={index} className="relative">
                  {isSelecting && (
                    <input type="checkbox" className="absolute top-1 left-1" onChange={() => toggleSelect(index)} checked={selectedItems.includes(index)} />
                  )}
                  {activeTab === "images" ? (
                    <img src={item.url} alt="Lưu trữ" className="w-20 h-20 object-cover rounded-md" />
                  ) : activeTab === "files" ? (
                    <div className="p-2 border rounded bg-gray-100 text-sm text-center">{item.name}</div>
                  ) : (
                    <a href={item.url} className="text-blue-500 underline text-sm block" target="_blank" rel="noopener noreferrer">
                      {item.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StoragePage;
