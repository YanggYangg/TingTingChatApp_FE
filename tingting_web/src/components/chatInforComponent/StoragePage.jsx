import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaCalendarAlt, FaArrowLeft, FaDownload } from "react-icons/fa";
import { IoCheckbox, IoCheckboxOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import {
  getChatMedia,
  onChatMedia,
  offChatMedia,
  getChatFiles,
  onChatFiles,
  offChatFiles,
  getChatLinks,
  onChatLinks,
  offChatLinks,
  deleteMessageChatInfo,
  onMessageDeleted,
  offMessageDeleted,
  onError,
} from "../../services/sockets/events/chatInfo";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import { Api_Profile } from '../../../apis/api_profile';

// Assume userId is passed as a prop or retrieved from context
const StoragePage = ({ socket, onClose, conversationId, onDelete, userId }) => {
  const [activeTab, setActiveTab] = useState("images");
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
  const [userProfiles, setUserProfiles] = useState({});

  console.log("StoragePage component mounted conversationId:", conversationId);
  console.log("StoragePage component mounted socket:", socket);

  const fetchUserProfile = async (id) => {
    if (userProfiles[id]) return userProfiles[id];
    try {
      const response = await Api_Profile.getProfile(id);
      const user = response?.data?.user;
      const profile = user || { _id: id, firstname: 'Không tìm thấy', surname: '', avatar: null };
      setUserProfiles((prev) => ({ ...prev, [id]: profile }));
      return profile;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      const profile = { _id: id, firstname: 'Không tìm thấy', surname: '', avatar: null };
      setUserProfiles((prev) => ({ ...prev, [id]: profile }));
      return profile;
    }
  };

  useEffect(() => {
    if (!socket || !conversationId) return;

    const fetchData = async () => {
      try {
        getChatMedia(socket, { conversationId }, async (response) => {
          if (response.success) {
            // Sửa: Chờ kết quả của formatData trước khi gán vào state
            const formattedImages = await formatData(response.data, "media");
            setData((prev) => ({
              ...prev,
              images: Array.isArray(formattedImages) ? formattedImages : [],
            }));
            console.log("Dữ liệu media:", formattedImages);
          } else {
            setError("Lỗi khi tải media: " + response.message);
          }
        });

        getChatFiles(socket, { conversationId }, async (response) => {
          if (response.success) {
            // Sửa: Chờ kết quả của formatData trước khi gán vào state
            const formattedFiles = await formatData(response.data, "file");
            setData((prev) => ({
              ...prev,
              files: Array.isArray(formattedFiles) ? formattedFiles : [],
            }));
            console.log("Dữ liệu files:", formattedFiles);
          } else {
            setError("Lỗi khi tải files: " + response.message);
          }
        });

        getChatLinks(socket, { conversationId }, async (response) => {
          if (response.success) {
            // Sửa: Chờ kết quả của formatData trước khi gán vào state
            const formattedLinks = await formatData(response.data, "link");
            setData((prev) => ({
              ...prev,
              links: Array.isArray(formattedLinks) ? formattedLinks : [],
            }));
            console.log("Dữ liệu links:", formattedLinks);
          } else {
            setError("Lỗi khi tải links: " + response.message);
          }
        });

        onChatMedia(socket, async (media) => {
          // Sửa: Chờ kết quả của formatData trước khi gán vào state
          const formattedImages = await formatData(media, "media");
          setData((prev) => ({
            ...prev,
            images: Array.isArray(formattedImages) ? formattedImages : [],
          }));
        });

        onChatFiles(socket, async (files) => {
          // Sửa: Chờ kết quả của formatData trước khi gán vào state
          const formattedFiles = await formatData(files, "file");
          setData((prev) => ({
            ...prev,
            files: Array.isArray(formattedFiles) ? formattedFiles : [],
          }));
        });

        onChatLinks(socket, async (links) => {
          // Sửa: Chờ kết quả của formatData trước khi gán vào state
          const formattedLinks = await formatData(links, "link");
          setData((prev) => ({
            ...prev,
            links: Array.isArray(formattedLinks) ? formattedLinks : [],
          }));
        });

        onMessageDeleted(socket, (data) => {
          setData((prev) => {
            const newData = { ...prev };
            if (data.isMessageDeleted) {
              newData.images = Array.isArray(newData.images) ? newData.images.filter((item) => item.messageId !== data.messageId) : [];
              newData.files = Array.isArray(newData.files) ? newData.files.filter((item) => item.messageId !== data.messageId) : [];
              newData.links = Array.isArray(newData.links) ? newData.links.filter((item) => item.messageId !== data.messageId) : [];
            } else if (data.urlIndex !== null) {
              newData[activeTab] = Array.isArray(newData[activeTab])
                ? newData[activeTab].filter(
                  (item) => !(item.messageId === data.messageId && item.urlIndex === data.urlIndex)
                )
                : [];
            }
            return newData;
          });
        });

        socket.on("deleteAllChatHistory", (data) => {
          console.log("StoragePage: Nhận sự kiện deleteAllChatHistory:", data);
          if (data.conversationId === conversationId) {
            console.log("StoragePage: Xóa toàn bộ dữ liệu do lịch sử trò chuyện bị xóa");
            setData({ images: [], files: [], links: [] });
            setError("Lịch sử trò chuyện đã bị xóa.");
          }
        });

        onError(socket, (error) => {
          setError("Lỗi từ server: " + error.message);
        });

        setError(null);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setError("Lỗi khi tải dữ liệu. Vui lòng thử lại.");
      }
    };

    fetchData();

    return () => {
      offChatMedia(socket);
      offChatFiles(socket);
      offChatLinks(socket);
      offMessageDeleted(socket);
      socket.off("deleteAllChatHistory");
      socket.off("error");
    };
  }, [socket, conversationId, userProfiles]);

  const formatData = async (items, dataType) => {
    if (!Array.isArray(items)) {
      console.warn(`Dữ liệu ${dataType} không phải mảng:`, items);
      return [];
    }

    return await Promise.all(
      items.flatMap(async ({ linkURL, createdAt, userId: messageUserId, content, _id, messageType }) => {
        const urls = Array.isArray(linkURL)
          ? linkURL.filter((url) => url && typeof url === "string")
          : typeof linkURL === "string"
            ? [linkURL]
            : [];
        if (urls.length === 0) {
          console.warn(`Tin nhắn ${_id} thiếu linkURL hợp lệ:`, { linkURL, messageType });
          return [];
        }

        const senderProfile = messageUserId === userId
          ? { firstname: 'Bạn', surname: '' }
          : await fetchUserProfile(typeof messageUserId === "string" ? messageUserId : messageUserId?._id || "Không tên");

        return urls.map((url, urlIndex) => ({
          id: `${_id}_${urlIndex}`,
          messageId: _id,
          urlIndex,
          url,
          date: createdAt ? new Date(createdAt).toISOString().split("T")[0] : "",
          sender: messageUserId === userId ? 'Bạn' : `${senderProfile.firstname} ${senderProfile.surname}`.trim() || 'Người dùng',
          name: content || `Không có tên`,
          type: messageType === "video" ? "video" : dataType === "file" ? "file" : dataType === "link" ? "link" : "image",
        }));
      })
    ).then((results) => results.flat().filter((item) => item.url));
  };

  // Sửa: Thêm kiểm tra Array.isArray để đảm bảo data[activeTab] là mảng
  const filteredData = useMemo(
    () =>
      Array.isArray(data[activeTab])
        ? data[activeTab].filter(
          ({ sender, date }) =>
            (filterSender === "Tất cả" || sender === filterSender) &&
            (!startDate || new Date(date) >= new Date(startDate)) &&
            (!endDate || new Date(date) <= new Date(endDate))
        )
        : [],
    [data, activeTab, filterSender, startDate, endDate]
  );

  const getUniqueSenders = () => ["Tất cả", ...new Set(data[activeTab]?.map((item) => item.sender) || [])];

  const handleDateFilter = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
    setShowDateSuggestions(false);
  };

  const downloadImage = (url, filename) => {
    if (!url) {
      console.error("StoragePage: Không có link file để tải.");
      toast.error("Không thể tải hình ảnh/video: Thiếu URL.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || "media");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

const handleDownloadFile = (file) => {
    if (!file?.url) {
      console.error("StoragePage: Không có link file để tải.");
      toast.error("Không thể tải tệp: Thiếu URL.");
      return;
    }
    const link = document.createElement("a");
    link.href = file.url;
    link.setAttribute("download", file.name || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewFile = (file) => {
    if (!file?.url) {
      console.error("Không có link file để xem trước.");
      return;
    }
    setPreviewFile(file);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map((item) => item.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      console.log("Không có mục nào được chọn để xóa.");
      toast.error("Vui lòng chọn ít nhất một mục để xóa.");
      return;
    }

    try {
      const deletionPromises = selectedItems.map(async (id) => {
        const item = data[activeTab]?.find((item) => item.id === id);
        if (!item) {
          console.warn(`Không tìm thấy mục với id: ${id}`);
          return { success: false, message: `Không tìm thấy mục với id: ${id}` };
        }

        return new Promise((resolve) => {
          deleteMessageChatInfo(socket, { messageId: item.messageId, urlIndex: item.urlIndex }, (response) => {
            if (response.success) {
              resolve({ success: true, item, isMessageDeleted: response.data.isMessageDeleted });
            } else {
              resolve({ success: false, message: response.message });
            }
          });
        });
      });

      const results = await Promise.all(deletionPromises);
      const failedDeletions = results.filter((result) => !result.success);

      if (failedDeletions.length > 0) {
        const errorMessages = failedDeletions.map((result) => result.message).join("; ");
        toast.error(`Lỗi khi xóa một số mục: ${errorMessages}`);
      }

      const newData = { ...data };
      results
        .filter((result) => result.success)
        .forEach(({ item, isMessageDeleted }) => {
          if (isMessageDeleted) {
            newData.images = Array.isArray(newData.images) ? newData.images.filter((i) => i.messageId !== item.messageId) : [];
            newData.files = Array.isArray(newData.files) ? newData.files.filter((i) => i.messageId !== item.messageId) : [];
            newData.links = Array.isArray(newData.links) ? newData.links.filter((i) => i.messageId !== item.messageId) : [];
          } else {
            newData[activeTab] = Array.isArray(newData[activeTab])
              ? newData[activeTab].filter((i) => i.id !== item.id)
              : [];
          }
        });

      setData(newData);

      if (onDelete) {
        const deletedItems = results
          .filter((result) => result.success)
          .map(({ item }) => ({ messageId: item.messageId }));
        onDelete(deletedItems);
      }

      setSelectedItems([]);
      setIsSelecting(false);

      if (failedDeletions.length === 0) {
        toast.success(`Đã xóa ${selectedItems.length} mục thành công.`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa mục:", error);
      toast.error("Lỗi: Không thể xóa mục. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (fullScreenImage && fullScreenImage.type === "video" && videoRef.current) {
      videoRef.current.play().catch((error) => console.error("Lỗi khi phát video:", error));
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
    <div className="p-4 border rounded-lg bg-white shadow-md">
      <button
        className="w-full text-left p-2 font-semibold text-sm text-gray-700 hover:bg-gray-100 rounded"
        onClick={() => setShowDateSuggestions(!showDateSuggestions)}
      >
        Gợi ý thời gian
      </button>
      {showDateSuggestions &&
        [7, 30, 90].map((days) => (
          <button
            key={days}
            className="block w-full p-2 text-left hover:bg-gray-100 text-sm text-gray-600 rounded"
            onClick={() => handleDateFilter(days)}
          >
            {days} ngày trước
          </button>
        ))}
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-700">Chọn khoảng thời gian</p>
        <div className="flex gap-2 mt-2">
          {[startDate, endDate].map((date, index) => (
            <div key={index} className="relative w-1/2">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="border p-2 pl-10 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={date}
                onChange={(e) => (index === 0 ? setStartDate(e.target.value) : setEndDate(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DateSection = ({ date, data, activeTab }) => (
    <div className="mt-4">
      <h2 className="font-bold text-sm text-gray-800 mb-2">
        Ngày {date.split("-").reverse().join(" Tháng ")}
      </h2>
      <div
        className={`grid ${activeTab === "images" ? "grid-cols-4 gap-0.5" : "grid-cols-1 gap-2"
          } mt-2`}
      >
        {data
          .filter((item) => item.date === date)
          .map((item) => (
            <div
              key={item.id}
              className={`flex ${activeTab === "images" ? "flex-col items-center" : "items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition"
                } relative group`}
            >
              {isSelecting && (
                <input
                  type="checkbox"
                  className="absolute top-3 left-3 z-10 h-5 w-5 text-blue-600"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, item.id]);
                    } else {
                      setSelectedItems(selectedItems.filter((id) => id !== item.id));
                    }
                  }}
                />
              )}
              {activeTab === "images" ? (
                <div className="relative group">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className={`w-22 h-22 rounded-md object-cover cursor-pointer transition-all duration-200 ${isSelecting ? "" : "hover:scale-105 hover:shadow-lg"
                        }`}
                      onClick={() => (isSelecting ? null : setFullScreenImage(item))}
                    />
                  ) : (
                    <video
                      src={item.url}
                      className={`w-22 h-22 rounded-md object-cover cursor-pointer transition-all duration-200 ${isSelecting ? "" : "hover:scale-105 hover:shadow-lg"
                        }`}
                      onClick={() => (isSelecting ? null : setFullScreenImage(item))}
                    />
                  )}
                </div>
              ) : activeTab === "files" ? (
                <div className="flex-1 flex items-center justify-between pl-8">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePreviewFile(item);
                    }}
                    className="text-blue-600 text-sm font-medium hover:underline truncate"
                  >
                    {item.name}
                  </a>
                  <button
                    className="text-gray-500 hover:text-blue-600 transition"
                    onClick={() => handleDownloadFile(item)}
                  >
                    <FaDownload size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between pl-8">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <a
                      href={item.url}
                      className="text-blue-600 text-xs hover:underline truncate block"
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
    <div className="fixed top-0 right-0 h-full w-[410px] bg-white shadow-xl p-4 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onClose} className="text-blue-600 hover:text-blue-800 transition">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Kho lưu trữ</h1>
        {isSelecting ? (
          <div className="flex gap-2">
            <button
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={handleSelectAll}
            >
              {selectedItems.length === filteredData.length ? (
                <IoCheckbox size={20} className="mr-1" />
              ) : (
                <IoCheckboxOutline size={20} className="mr-1" />
              )}
              Chọn tất cả
            </button>
            <button
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              onClick={handleDeleteSelected}
            >
              Xóa ({selectedItems.length})
            </button>
            <button
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              onClick={() => {
                setIsSelecting(false);
                setSelectedItems([]);
              }}
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={() => setIsSelecting(true)}
          >
            Chọn
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        {["images", "files", "links"].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 font-medium text-sm text-center transition-colors ${activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-red-600 text-sm mt-4 font-medium">{error}</p>
      ) : filteredData.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4 font-medium">Không có dữ liệu</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <select
              className="border p-2 rounded-md text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border p-2 rounded-md text-sm flex-1 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="mt-4 space-y-6">
            {[...new Set(filteredData.map(({ date }) => date))].sort().map((date) => (
              <DateSection key={date} date={date} data={filteredData} activeTab={activeTab} />
            ))}
          </div>
        </>
      )}

      {/* Full-screen image/video modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="relative flex bg-white rounded-lg shadow-2xl max-w-[90vw] max-h-[90vh]">
            <div className="relative flex items-center justify-center w-[60vw] h-[90vh] p-4">
              {fullScreenImage.type === "image" ? (
                <img
                  src={fullScreenImage.url}
                  alt={fullScreenImage.name}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={fullScreenImage.url}
                  controls
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              )}
              <button
                className="absolute top-4 right-4 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition"
                onClick={() => setFullScreenImage(null)}
              >
                ✕
              </button>
              <button
                onClick={() => downloadImage(fullScreenImage.url, fullScreenImage.name)}
                className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaDownload size={16} /> Tải xuống
              </button>
            </div>
            <div className="w-20 bg-gray-900 p-2 overflow-y-auto flex flex-col items-center">
              {data.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.name}
                  className={`w-16 h-16 rounded-md object-cover cursor-pointer mb-2 transition-all duration-200 ${fullScreenImage.url === img.url
                      ? "opacity-100 border-2 border-blue-400"
                      : "opacity-50 hover:opacity-100 hover:shadow-md"
                    }`}
                  onClick={() => setFullScreenImage(img)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File preview modal */}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl h-[90vh] flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4 text-gray-800">{previewFile.name || "Xem nội dung"}</h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.url }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: "100%" }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-red-600 transition"
                onClick={() => setPreviewFile(null)}
              >
                ✕
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                onClick={() => handleDownloadFile(previewFile)}
              >
                <FaDownload size={16} /> Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoragePage;