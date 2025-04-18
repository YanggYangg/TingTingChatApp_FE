import React from "react";
import { FileText, Image, Folder, Download } from "lucide-react";

const storageItems = [
  {
    id: 1,
    name: "Báo cáo quý 1.pdf",
    type: "file",
    url: "https://example.com/report-q1.pdf",
  },
  {
    id: 2,
    name: "Ảnh họp nhóm.jpg",
    type: "image",
    url: "https://via.placeholder.com/150",
  },
  {
    id: 3,
    name: "Thư mục dự án",
    type: "folder",
    url: "#",
  },
];

const StorageItem = ({ item }) => {
  const icon =
    item.type === "file" ? (
      <FileText className="text-blue-500" />
    ) : item.type === "image" ? (
      <Image className="text-green-500" />
    ) : (
      <Folder className="text-yellow-500" />
    );

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium">{item.name}</span>
      </div>
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <Download className="text-gray-600 hover:text-black" />
      </a>
    </div>
  );
};

const StoragePage = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-700">Tệp đã lưu</h2>
      <div className="space-y-2">
        {storageItems.map((item) => (
          <StorageItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default StoragePage;
