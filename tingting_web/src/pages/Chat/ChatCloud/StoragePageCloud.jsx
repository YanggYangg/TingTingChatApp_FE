import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaCalendarAlt, FaArrowLeft, FaDownload } from "react-icons/fa";
import axios from "axios";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

const StoragePageCloud = ({
  onClose,
  conversationId,
  onDelete,
  userId,
  cloudMessages,
  initialTab = "images", // Thêm prop initialTab với mặc định là "images"
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [data, setData] = useState({ images: [], files: [], links: [] });
  const [error, setError] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const videoRef = useRef(null);

  // Đặt lại trạng thái khi mở StoragePageCloud
  useEffect(() => {
    setActiveTab(initialTab);
    setFilterSender("Tất cả");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
    setShowDateSuggestions(false);
    setSelectedItems([]);
    setIsSelecting(false);
    setPreviewFile(null);
    setFullScreenImage(null);
  }, [initialTab]);

  // Cập nhật data từ cloudMessages
  useEffect(() => {
    if (!conversationId || conversationId !== "my-cloud" || !cloudMessages)
      return;

    const formattedData = {
      images: [],
      files: [],
      links: [],
    };

    cloudMessages.forEach((msg) => {
      const item = {
        id: msg.messageId,
        messageId: msg.messageId,
        urlIndex: 0,
        url: msg.fileUrls?.[0] || msg.content || "",
        date: new Date(msg.timestamp).toISOString().split("T")[0],
        sender: userId,
        name: msg.filenames?.[0] || msg.content || "Không có tên",
        type: "file",
      };

      if (msg.fileUrls?.[0]) {
        if (/\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrls[0])) {
          item.type = "image";
          formattedData.images.push(item);
        } else if (/\.(mp4|webm)$/i.test(msg.fileUrls[0])) {
          item.type = "video";
          formattedData.images.push(item);
        } else {
          formattedData.files.push(item);
        }
      } else if (
        msg.content?.match(/^(https?:\/\/[^\s]+)/) &&
        (!msg.fileUrls || msg.fileUrls.length === 0)
      ) {
        item.type = "link";
        item.url = msg.content.match(/^(https?:\/\/[^\s]+)/)[0];
        formattedData.links.push(item);
      }
    });

    setData(formattedData);
    setError(formattedData[activeTab].length ? null : "Không có dữ liệu.");
  }, [conversationId, cloudMessages, activeTab]);

  const formatData = (items, dataType) => {
    if (!Array.isArray(items)) {
      console.warn(`Dữ liệu ${dataType} không phải mảng:`, items);
      return [];
    }

    return items.map((item) => ({
      id: item.id,
      messageId: item.messageId,
      urlIndex: item.urlIndex,
      url: item.url,
      date: item.date,
      sender: item.sender,
      name: item.name,
      type: item.type,
    }));
  };

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

  const getUniqueSenders = () => [
    "Tất cả",
    ...new Set(data[activeTab].map((item) => item.sender)),
  ];

  const handleDateFilter = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
    setShowDateSuggestions(false);
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
      alert("Không thể tải file. Thử tải trực tiếp!");
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
    downloadImage(file.url, file.name);
  };

  const handlePreviewFile = (file) => {
    if (!file?.url) {
      console.error("Không có link file để xem trước.");
      return;
    }
    setPreviewFile(file);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      console.log("Không có mục nào được chọn để xóa.");
      alert("Vui lòng chọn ít nhất một mục để xóa.");
      return;
    }

    try {
      const items = selectedItems
        .map((id) => {
          const item = data[activeTab].find((item) => item.id === id);
          return item ? { messageId: item.messageId } : null;
        })
        .filter(Boolean);

      if (items.length === 0) {
        console.error("Không tìm thấy mục để xóa.");
        alert("Lỗi: Không tìm thấy mục để xóa.");
        return;
      }

      await Promise.all(
        items.map((item) =>
          axios.delete(`http://184.73.0.29:3000/api/messages/${item.messageId}`)
        )
      );

      const newData = {
        images: data.images.filter((item) => !selectedItems.includes(item.id)),
        files: data.files.filter((item) => !selectedItems.includes(item.id)),
        links: data.links.filter((item) => !selectedItems.includes(item.id)),
      };
      setData(newData);

      if (onDelete) {
        onDelete(items);
      }

      setSelectedItems([]);
      setIsSelecting(false);
      alert(`Đã xóa ${selectedItems.length} mục thành công.`);
    } catch (error) {
      console.error("Lỗi khi xóa mục:", error);
      alert("Lỗi: Không thể xóa mục. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (
      fullScreenImage &&
      fullScreenImage.type === "video" &&
      videoRef.current
    ) {
      videoRef.current
        .play()
        .catch((error) => console.error("Lỗi khi phát video:", error));
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [fullScreenImage]);

  const DateFilter = ({
    showDateSuggestions,
    setShowDateSuggestions,
    handleDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  }) => (
    <div className="p-2 border rounded bg-white shadow-lg z-[1000]">
      <button
        className="w-full text-left p-2 font-semibold text-sm"
        onClick={() => setShowDateSuggestions(!showDateSuggestions)}
      >
        Gợi ý thời gian
      </button>
      {showDateSuggestions &&
        [7, 30, 90].map((days) => (
          <button
            key={days}
            className="block w-full p-2 text-left hover:bg-gray-200 text-sm"
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
                className="border p-1 pl-8 rounded text-xs w-full"
                value={date}
                onChange={(e) =>
                  index === 0
                    ? setStartDate(e.target.value)
                    : setEndDate(e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DateSection = ({ date, data, activeTab }) => (
    <div className="mt-4">
      <h2 className="font-bold text-sm text-gray-800">
        Ngày {date.split("-").reverse().join(" Tháng ")}
      </h2>
      <div
        className={`grid ${
          activeTab === "images" ? "grid-cols-4" : "grid-cols-1"
        } gap-4 mt-2`}
      >
        {data
          .filter((item) => item.date === date)
          .map((item) => (
            <div key={item.id} className="flex flex-col items-center">
              {activeTab === "images" ? (
                <div className="relative group">
                  {isSelecting && (
                    <input
                      type="checkbox"
                      className="absolute top-2 left-2 z-[1001] opacity-100"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== item.id)
                          );
                        }
                      }}
                    />
                  )}
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className={`w-20 h-20 rounded-md object-cover cursor-pointer transition-all ${
                        isSelecting ? "" : "hover:scale-105"
                      }`}
                      onClick={() =>
                        isSelecting ? null : setFullScreenImage(item)
                      }
                    />
                  ) : (
                    <video
                      src={item.url}
                      className={`w-20 h-20 rounded-md object-cover cursor-pointer transition-all ${
                        isSelecting ? "" : "hover:scale-105"
                      }`}
                      onClick={() =>
                        isSelecting ? null : setFullScreenImage(item)
                      }
                    />
                  )}
                </div>
              ) : activeTab === "files" ? (
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md relative group w-full">
                  {isSelecting && (
                    <input
                      type="checkbox"
                      className="absolute top-2 left-2 z-[1001] opacity-100"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== item.id)
                          );
                        }
                      }}
                    />
                  )}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePreviewFile(item);
                    }}
                    className="text-blue-500 text-sm font-semibold"
                  >
                    {item.name}
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md relative group w-full">
                  {isSelecting && (
                    <input
                      type="checkbox"
                      className="absolute top-2 left-2 z-[1001] opacity-100"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(
                            selectedItems.filter((id) => id !== item.id)
                          );
                        }
                      }}
                    />
                  )}
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
    <div className="absolute right-0 top-0 h-full w-[410px] bg-white shadow-lg p-4 overflow-y-auto z-[999]">
      <div className="flex justify-between mb-4">
        <button onClick={onClose} className="text-blue-500 text-sm">
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-bold">Kho lưu trữ</h1>
        {isSelecting ? (
          <>
            <button
              className="text-red-500 text-sm"
              onClick={handleDeleteSelected}
            >
              Xóa ({selectedItems.length})
            </button>
            <button
              className="text-gray-500 text-sm"
              onClick={() => {
                setIsSelecting(false);
                setSelectedItems([]);
              }}
            >
              Hủy
            </button>
          </>
        ) : (
          <button
            className="text-blue-500 text-sm"
            onClick={() => setIsSelecting(true)}
          >
            Chọn
          </button>
        )}
      </div>

      <div className="flex border-b justify-between">
        {["images", "files", "links"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images"
              ? "Ảnh/Video"
              : tab === "files"
              ? "Files"
              : "Links"}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      ) : filteredData.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4">Không có dữ liệu</p>
      ) : (
        <>
          <div className="flex gap-2 my-2">
            <select
              className="border p-1 rounded text-sm w-1/2"
              value={filterSender}
              onChange={(e) => setFilterSender(e.target.value)}
            >
              {getUniqueSenders().map((sender) => (
                <option key={sender} value={sender}>
                  {sender}
                </option>
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
              <DateSection
                key={date}
                date={date}
                data={filteredData}
                activeTab={activeTab}
              />
            ))}
          </div>
        </>
      )}

      {fullScreenImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[1000]">
          <div className="relative flex bg-white rounded-lg shadow-lg">
            <div className="relative flex items-center justify-center w-[60vw] h-[90vh] p-4">
              {fullScreenImage.type === "image" ? (
                <img
                  src={fullScreenImage.url}
                  alt={fullScreenImage.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={fullScreenImage.url}
                  controls
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
              <button
                className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2"
                onClick={() => setFullScreenImage(null)}
              >
                ✖
              </button>
            </div>
            <div className="w-40 h-[90vh] bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {data.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.name}
                  className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all ${
                    fullScreenImage.url === img.url
                      ? "opacity-100 border-2 border-blue-400"
                      : "opacity-50 hover:opacity-100"
                  }`}
                  onClick={() => setFullScreenImage(img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-[1000]">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">
              {previewFile.name || "Xem nội dung"}
            </h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.url }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: "100%" }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => setPreviewFile(null)}
              >
                ✖
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoragePageCloud;
