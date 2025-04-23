import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload, FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import ShareModal from '../chat/ShareModal';

const GroupFile = ({ conversationId, onDeleteFile, onForwardFile, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [data, setData] = useState({ files: [] });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToForward, setFileToForward] = useState(null);
  const [messageIdToForward, setMessageIdToForward] = useState(null);

  // Hàm gọi API để lấy danh sách file của cuộc trò chuyện
  const fetchFiles = async () => {
    if (!conversationId) {
      console.warn("conversationId không được cung cấp.");
      setFiles([]);
      setData({ files: [] });
      return;
    }
    try {
      const response = await Api_chatInfo.getChatFiles(conversationId);
      const fileData = Array.isArray(response) ? response : response?.data;

      console.log('[GET] Phản hồi API (lấy file):', fileData);
      if (Array.isArray(fileData)) {
        // Sắp xếp file theo thời gian tạo mới nhất và lấy 3 file đầu tiên
        const sortedFiles = fileData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || 0);
        setFiles(sortedFiles.slice(0, 3).map(file => ({
          ...file,
          // Đảm bảo có trường id để làm key
          id: file?._id || file?.id,
        })));
        // Lưu trữ toàn bộ danh sách file cho StoragePage
        setData({ files: sortedFiles });
      } else {
        setFiles([]);
        setData({ files: [] });
        console.warn("API không trả về mảng hợp lệ.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách file:", error);
      setFiles([]);
      setData({ files: [] });
    }
  };

  // useEffect hook để gọi fetchFiles khi conversationId thay đổi
  useEffect(() => {
    console.log("Fetching files for conversationId:", conversationId);
    fetchFiles();
  }, [conversationId]);

  // Hàm xử lý sự kiện tải xuống file
  const handleDownload = (file) => {
    if (!file?.linkURL) {
      console.error("Không có link file để tải.");
      return;
    }
    const link = document.createElement("a");
    link.href = file.linkURL;
    link.setAttribute("download", file.content || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hàm xử lý sự kiện chuột vào một item file
  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  // Hàm xử lý sự kiện chuột rời khỏi một item file
  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  // Hàm xử lý sự kiện click vào nút chuyển tiếp file
  const handleForwardClick = (fileItem, event) => {
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra các phần tử cha
    setFileToForward(fileItem);
    setMessageIdToForward(fileItem._id); // Gán ID tin nhắn chứa file
    setIsShareModalOpen(true); // Mở modal chia sẻ
    console.log("Yêu cầu chuyển tiếp file:", fileItem, "messageId:", fileItem._id);
  };


  // Hàm xử lý sự kiện đóng modal chia sẻ
  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setFileToForward(null);
    setMessageIdToForward(null);
  };

  // Hàm xử lý sự kiện file được chia sẻ thành công từ modal
  const handleFileShared = async (targetConversations, shareContent) => {
    if (!fileToForward?._id) {
      console.error("Không có ID tin nhắn để chuyển tiếp.");
      return;
    }
    if (!userId) {
      console.error("Không có ID người dùng để chuyển tiếp.");
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn("Không có cuộc trò chuyện nào được chọn để chuyển tiếp.");
      return;
    }

    try {
      const response = await Api_chatInfo.forwardMessage({
        messageId: fileToForward._id,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      });

      console.log("Phản hồi API chuyển tiếp:", response);
      if (response && Array.isArray(response)) {
        console.log(`Đã chuyển tiếp tệp đến ${response.length} cuộc trò chuyện.`);
        setIsShareModalOpen(false); // Đóng modal sau khi chuyển tiếp thành công
        setFileToForward(null);
        setMessageIdToForward(null);
        if (onForwardFile) {
          onForwardFile(fileToForward, targetConversations, shareContent); // Gọi callback từ component cha
        }
      } else if (response?.message) {
        console.error(`Lỗi chuyển tiếp: ${response.message}`);
      } else {
        console.error("Lỗi không xác định khi chuyển tiếp.");
      }
    } catch (error) {
      console.error("Lỗi khi gọi API chuyển tiếp:", error);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div
              key={file.id || index}
              className="relative group flex items-center justify-between bg-gray-100 p-2 rounded-md"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold truncate"
                style={{ maxWidth: '70%' }}
              >
                {file.content || "Không có tên"}
              </a>
              <div
                className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
              >
                {/* <button
                  onClick={(event) => handleDeleteClick(file, event)}
                  className="text-gray-300 hover:text-red-500"
                  title="Xóa"
                >
                  <FaTrash size={16} />
                </button> */}
                <button
                  onClick={(event) => handleForwardClick(file, event)}
                  className="text-gray-300 hover:text-blue-500"
                  title="Chuyển tiếp"
                >
                  <FaShare size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-blue-500"
                  onClick={() => setPreviewFile(file)}
                  title="Xem trước"
                >
                  <FaRegFolderOpen size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-green-500"
                  onClick={() => handleDownload(file)}
                  title="Tải xuống"
                >
                  <FaDownload size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Không có tệp nào.</p>
        )}
      </div>
      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>
      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          files={data.files}
          onClose={() => setIsOpen(false)}
          onDelete={fetchFiles}
          onForwardFile={onForwardFile}
        />
      )}

      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">{previewFile.content || "Xem nội dung"}</h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.linkURL }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%' }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => setPreviewFile(null)}
              >
                ✖
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => handleDownload(previewFile)}
              >
                Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chia sẻ */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleFileShared}
        userId={userId}
        messageId={messageIdToForward} // Đã đổi tên prop thành 'messageId'
        messageToForward={fileToForward}
      />
    </div>
  );
};

export default GroupFile;