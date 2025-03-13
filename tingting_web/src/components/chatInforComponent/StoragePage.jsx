import { useState } from "react";

const StoragePage = () => {
  const [activeTab, setActiveTab] = useState("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [filterDate, setFilterDate] = useState("Mới nhất");

  const data = {
    images: {
      "10 Tháng 3": [
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
      ],
      "09 Tháng 3": [
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
      ],
    },
    files: {
      "08 Tháng 3": ["Tài liệu 1.pdf", "Báo cáo.docx"],
    },
    links: {
      "07 Tháng 3": ["https://example.com", "https://reactjs.org"],
    },
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-4">Kho lưu trữ</h1>
      <div className="flex border-b">
        {[
          { key: "images", label: "Ảnh/Video" },
          { key: "files", label: "Files" },
          { key: "links", label: "Links" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.key ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between my-4">
        <select className="border p-2 rounded" onChange={(e) => setFilterSender(e.target.value)}>
          <option>Tất cả</option>
          <option>Bạn A</option>
          <option>Bạn B</option>
        </select>
        <select className="border p-2 rounded" onChange={(e) => setFilterDate(e.target.value)}>
          <option>Mới nhất</option>
          <option>Cũ nhất</option>
        </select>
      </div>
      <div>
        {Object.entries(data[activeTab] || {}).map(([date, items]) => (
          <div key={date} className="mb-4">
            <h2 className="font-semibold text-gray-600 mb-2">Ngày {date}</h2>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, index) => (
                activeTab === "images" ? (
                  <img key={index} src={item} alt="Lưu trữ" className="w-full h-24 object-cover rounded" />
                ) : activeTab === "files" ? (
                  <div key={index} className="p-2 border rounded bg-gray-100">{item}</div>
                ) : (
                  <a key={index} href={item} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
                    {item}
                  </a>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoragePage;
