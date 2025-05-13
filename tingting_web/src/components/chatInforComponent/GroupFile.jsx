import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload, FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import {
  getChatFiles,
  forwardMessage,
  deleteMessage,
  onChatFiles,
  offChatFiles,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import ShareModal from "../chat/ShareModal";

const GroupFile = ({ conversationId, onDeleteFile, onForwardFile, userId, socket }) => {
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
  const [error, setError] = useState(null);

  // Hàm lấy danh sách file bằng Socket.IO
  const fetchFiles = () => {
    if (!conversationId || !socket) {
      console.warn("GroupFile: conversationId hoặc socket không được cung cấp.");
      setFiles([]);
      setData({ files: [] });
      setError("Thiếu thông tin để tải tệp.");
      return;
    }

    getChatFiles(socket, { conversationId }, (response) => {
      if (response && response.success) {
        const fileData = Array.isArray(response.data) ? response.data : [];
        console.log("[Socket.IO] Phản hồi (lấy file):", fileData);
        if (Array.isArray(fileData)) {
          const sortedFiles = fileData.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || 0
          );
          setFiles(
            sortedFiles.slice(0, 3).map((file) => ({
              ...file,
              id: file?._id || file?.id,
            }))
          );
          setData({ files: sortedFiles });
          // setError(sortedFiles.length ? null : "Không có tệp nào.");
        } else {
          setFiles([]);
          setData({ files: [] });
          setError("Dữ liệu không hợp lệ.");
          console.warn("GroupFile: Socket.IO không trả về mảng hợp lệ.");
        }
      } else {
        setFiles([]);
        setData({ files: [] });
        setError("Lỗi khi tải tệp. Vui lòng thử lại.");
        console.error("GroupFile: Lỗi khi lấy danh sách file:", response?.message);
      }
    });
  };

  // Lắng nghe cập nhật danh sách file qua Socket.IO
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Cập nhật state trực tiếp từ dữ liệu nhận được
    onChatFiles(socket, (updatedFiles) => {
      console.log("[Socket.IO] Cập nhật danh sách file:", updatedFiles);
      if (Array.isArray(updatedFiles)) {
        const sortedFiles = updatedFiles.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || 0
        );
        setFiles(
          sortedFiles.slice(0, 3).map((file) => ({
            ...file,
            id: file?._id || file?.id,
          }))
        );
        setData({ files: sortedFiles });
        // setError(sortedFiles.length ? null : "Không có tệp nào.");
      } else {
        setFiles([]);
        setData({ files: [] });
        setError("Dữ liệu cập nhật không hợp lệ.");
        console.warn("GroupFile: Dữ liệu cập nhật không hợp lệ:", updatedFiles);
      }
    });

    onError(socket, (error) => {
      console.error("[Socket.IO] Lỗi:", error.message);
      setError(error.message || "Lỗi khi tải tệp.");
    });

    // Lắng nghe sự kiện xóa lịch sử trò chuyện
    socket.on("deleteAllChatHistory", (data) => {
      console.log("GroupFile: Nhận sự kiện deleteAllChatHistory:", data);
      if (data.conversationId === conversationId) {
        console.log("GroupFile: Xóa files do lịch sử trò chuyện bị xóa");
        setFiles([]);
        setData({ files: [] });
        setError("Lịch sử trò chuyện đã bị xóa.");
      }
    });

    // Gọi fetch lần đầu tiên khi component mount
    fetchFiles();

    return () => {
      console.log("GroupFile: Gỡ sự kiện socket");
      offChatFiles(socket);
      offError(socket);
      socket.off("deleteAllChatHistory");
    };
  }, [conversationId, socket]);

  const handleDownload = (file) => {
    if (!file?.linkURL) {
      console.error("GroupFile: Không có link file để tải.");
      setError("Không thể tải tệp: Thiếu URL.");
      return;
    }
    const link = document.createElement("a");
    link.href = file.linkURL;
    link.setAttribute("download", file.content || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  const handleForwardClick = (fileItem, event) => {
    event.stopPropagation();
    setFileToForward(fileItem);
    setMessageIdToForward(fileItem._id);
    setIsShareModalOpen(true);
    console.log("GroupFile: Yêu cầu chuyển tiếp file:", fileItem, "messageId:", fileItem._id);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setFileToForward(null);
    setMessageIdToForward(null);
  };

  const handleFileShared = (targetConversations, shareContent) => {
    if (!fileToForward?._id) {
      console.error("GroupFile: Không có ID tin nhắn để chuyển tiếp.");
      setError("Không thể chuyển tiếp: Thiếu ID tin nhắn.");
      return;
    }
    if (!userId) {
      console.error("GroupFile: Không có ID người dùng để chuyển tiếp.");
      setError("Không thể chuyển tiếp: Thiếu ID người dùng.");
      return;
    }
    if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
      console.warn("GroupFile: Không có cuộc trò chuyện nào được chọn để chuyển tiếp.");
      setError("Vui lòng chọn ít nhất một cuộc trò chuyện.");
      return;
    }

    forwardMessage(
      socket,
      {
        messageId: fileToForward._id,
        targetConversationIds: targetConversations,
        userId: userId,
        content: shareContent,
      },
      (response) => {
        if (response && response.success) {
          console.log(`GroupFile: Đã chuyển tiếp tệp đến ${response.data.length} cuộc trò chuyện.`);
          setIsShareModalOpen(false);
          setFileToForward(null);
          setMessageIdToForward(null);
          if (onForwardFile) {
            onForwardFile(fileToForward, targetConversations, shareContent);
          }
        } else {
          console.error("GroupFile: Lỗi khi chuyển tiếp:", response?.message);
          setError("Lỗi khi chuyển tiếp tệp: " + (response?.message || "Lỗi không xác định"));
        }
      }
    );
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
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
                style={{ maxWidth: "70%" }}
              >
                {file.content || "Không có tên"}
              </a>
              <div
                className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
              >
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
          socket={socket}
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleFileShared}
        userId={userId}
        messageId={messageIdToForward}
        messageToForward={fileToForward}
      />
    </div>
  );
};

export default GroupFile;